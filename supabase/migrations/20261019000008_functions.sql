-- Transactional operations called via supabase.rpc(...).
-- Functions that must bypass RLS (creating memberships, accepting
-- invitations) are SECURITY DEFINER and check auth.uid() themselves.

-- Hide token hashes even from people who may read the invitation row.
revoke select on public.invitations from authenticated;
grant select (
  id, organization_id, invitation_type, intended_role, email, student_id, expires_at,
  accepted_at, accepted_by, revoked_at, created_by, created_at
) on public.invitations to authenticated;

-- Create an organization; the caller becomes its admin (and optionally a teacher).
create function public.create_organization(
  p_name text,
  p_also_teacher boolean default false,
  p_organization_type text default 'mosque',
  p_preferred_language text default 'ar',
  p_timezone text default 'America/Toronto'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_org uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  insert into public.organizations (name, organization_type, preferred_language, timezone)
  values (trim(p_name), p_organization_type, p_preferred_language, p_timezone)
  returning id into v_org;

  insert into public.organization_memberships (organization_id, user_id, role)
  values (v_org, v_user, 'admin');

  if p_also_teacher then
    insert into public.organization_memberships (organization_id, user_id, role)
    values (v_org, v_user, 'teacher');
  end if;

  perform private.audit(v_org, 'organization.created', 'organization', v_org,
    jsonb_build_object('also_teacher', p_also_teacher));
  return v_org;
end;
$$;

-- Create an invitation and return the raw token ONCE. Only its hash is stored.
-- Teachers: admins only. Parents: admins or a teacher of that student.
create function public.create_invitation(
  p_organization_id uuid,
  p_type public.invitation_type,
  p_student_id uuid default null,
  p_email text default null,
  p_valid_for interval default interval '7 days'
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_token text;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if p_valid_for <= interval '0' or p_valid_for > interval '30 days' then
    raise exception 'invalid_expiry' using errcode = '22023';
  end if;

  if p_type = 'teacher' then
    if p_student_id is not null
       or not private.is_org_member(p_organization_id, array['admin']::public.membership_role[]) then
      raise exception 'not_allowed' using errcode = '42501';
    end if;
  else
    if p_student_id is null
       or not exists (
         select 1 from public.students s
         where s.id = p_student_id and s.organization_id = p_organization_id and s.status = 'active'
       )
       or not private.can_teach_student(p_student_id) then
      raise exception 'not_allowed' using errcode = '42501';
    end if;
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.invitations (
    organization_id, invitation_type, intended_role, email, student_id, token_hash, expires_at, created_by
  ) values (
    p_organization_id,
    p_type,
    case when p_type = 'teacher' then 'teacher'::public.membership_role end,
    nullif(lower(trim(p_email)), ''),
    p_student_id,
    sha256(convert_to(v_token, 'UTF8')),
    now() + p_valid_for,
    v_user
  )
  returning id into v_id;

  perform private.audit(p_organization_id, 'invitation.created', 'invitation', v_id,
    jsonb_build_object('type', p_type));
  return v_token;
end;
$$;

-- Revoke an unused invitation (its creator or an admin).
create function public.revoke_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.invitations;
begin
  select * into v_inv from public.invitations where id = p_invitation_id for update;
  if not found
     or (v_inv.created_by <> (select auth.uid())
         and not private.is_org_member(v_inv.organization_id, array['admin']::public.membership_role[])) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if v_inv.accepted_at is null and v_inv.revoked_at is null then
    update public.invitations set revoked_at = now() where id = p_invitation_id;
    perform private.audit(v_inv.organization_id, 'invitation.revoked', 'invitation', v_inv.id);
  end if;
end;
$$;

-- Accept an invitation. Single use, must be unexpired and unrevoked. If the
-- invitation names an email, the signed-in user's email must match.
create function public.accept_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_inv public.invitations;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_inv
  from public.invitations
  where token_hash = sha256(convert_to(coalesce(p_token, ''), 'UTF8'))
  for update;

  -- One generic error for every failure, so tokens can't be probed.
  if not found
     or v_inv.accepted_at is not null
     or v_inv.revoked_at is not null
     or v_inv.expires_at <= now()
     or (v_inv.email is not null and v_inv.email <> lower(coalesce((select auth.jwt()) ->> 'email', ''))) then
    raise exception 'invalid_invitation' using errcode = '22023';
  end if;

  if v_inv.invitation_type = 'teacher' then
    insert into public.organization_memberships (organization_id, user_id, role)
    values (v_inv.organization_id, v_user, 'teacher')
    on conflict (organization_id, user_id, role) do update set status = 'active';
  else
    insert into public.parent_student_relationships (organization_id, parent_user_id, student_id, status)
    values (v_inv.organization_id, v_user, v_inv.student_id, 'verified')
    on conflict (parent_user_id, student_id) do update set status = 'verified';
  end if;

  update public.invitations set accepted_at = now(), accepted_by = v_user where id = v_inv.id;

  perform private.audit(v_inv.organization_id, 'invitation.accepted', 'invitation', v_inv.id,
    jsonb_build_object('type', v_inv.invitation_type));

  return jsonb_build_object(
    'organization_id', v_inv.organization_id,
    'type', v_inv.invitation_type,
    'student_id', v_inv.student_id
  );
end;
$$;

-- Record a lesson with optional private note and next assignments, atomically.
-- Runs as the caller (RLS applies). Repeating the same idempotency key returns
-- the existing record instead of creating a duplicate.
--
-- p_next_memorization: {"start_surah":67,"start_ayah":6,"end_surah":67,"end_ayah":10,
--                       "due_date":"2026-10-26","instructions":"..."}  or null
-- p_next_revisions:    array of the same shape (plus optional "priority" 1-3)
create function public.record_lesson(
  p_student_id uuid,
  p_idempotency_key uuid,
  p_lesson_date date,
  p_start_surah smallint,
  p_start_ayah smallint,
  p_end_surah smallint,
  p_end_ayah smallint,
  p_performance_rating public.performance_rating,
  p_parent_visible_feedback text default null,
  p_private_note text default null,
  p_mistake_categories text[] default null,
  p_accuracy_score smallint default null,
  p_next_memorization jsonb default null,
  p_next_revisions jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_org uuid;
  v_record uuid;
  v_rev jsonb;
  v_index int := 0;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select organization_id into v_org from public.students where id = p_student_id;
  if v_org is null then
    raise exception 'student_not_found' using errcode = '42501';
  end if;

  select id into v_record
  from public.memorization_records
  where organization_id = v_org and idempotency_key = p_idempotency_key;
  if v_record is not null then
    return v_record;
  end if;

  insert into public.memorization_records (
    organization_id, student_id, teacher_user_id, lesson_date,
    start_surah, start_ayah, end_surah, end_ayah,
    performance_rating, accuracy_score, mistake_categories, parent_visible_feedback,
    idempotency_key, created_by
  ) values (
    v_org, p_student_id, v_user, p_lesson_date,
    p_start_surah, p_start_ayah, p_end_surah, p_end_ayah,
    p_performance_rating, p_accuracy_score, p_mistake_categories, nullif(trim(p_parent_visible_feedback), ''),
    p_idempotency_key, v_user
  )
  returning id into v_record;

  if nullif(trim(p_private_note), '') is not null then
    insert into public.memorization_record_private_notes (record_id, organization_id, body, updated_by)
    values (v_record, v_org, trim(p_private_note), v_user);
  end if;

  if p_next_memorization is not null and p_next_memorization <> 'null'::jsonb then
    insert into public.assignments (
      organization_id, student_id, assigned_by, assignment_type,
      start_surah, start_ayah, end_surah, end_ayah, assigned_date, due_date, instructions,
      source_record_id, idempotency_key
    ) values (
      v_org, p_student_id, v_user, 'memorization',
      (p_next_memorization ->> 'start_surah')::smallint, (p_next_memorization ->> 'start_ayah')::smallint,
      (p_next_memorization ->> 'end_surah')::smallint, (p_next_memorization ->> 'end_ayah')::smallint,
      p_lesson_date, (p_next_memorization ->> 'due_date')::date, p_next_memorization ->> 'instructions',
      v_record, md5(p_idempotency_key::text || ':memorization')::uuid
    );
  end if;

  for v_rev in select * from jsonb_array_elements(coalesce(p_next_revisions, '[]'::jsonb)) loop
    v_index := v_index + 1;
    insert into public.assignments (
      organization_id, student_id, assigned_by, assignment_type,
      start_surah, start_ayah, end_surah, end_ayah, assigned_date, due_date, priority, instructions,
      source_record_id, idempotency_key
    ) values (
      v_org, p_student_id, v_user, 'revision',
      (v_rev ->> 'start_surah')::smallint, (v_rev ->> 'start_ayah')::smallint,
      (v_rev ->> 'end_surah')::smallint, (v_rev ->> 'end_ayah')::smallint,
      p_lesson_date, (v_rev ->> 'due_date')::date, (v_rev ->> 'priority')::smallint, v_rev ->> 'instructions',
      v_record, md5(p_idempotency_key::text || ':revision:' || v_index)::uuid
    );
  end loop;

  return v_record;
exception
  when unique_violation then
    -- A concurrent retry with the same key won the race; return its record.
    select id into v_record
    from public.memorization_records
    where organization_id = v_org and idempotency_key = p_idempotency_key;
    if v_record is null then
      raise;
    end if;
    return v_record;
end;
$$;

-- Only signed-in users may call these.
revoke execute on function
  public.create_organization(text, boolean, text, text, text),
  public.create_invitation(uuid, public.invitation_type, uuid, text, interval),
  public.revoke_invitation(uuid),
  public.accept_invitation(text),
  public.record_lesson(uuid, uuid, date, smallint, smallint, smallint, smallint, public.performance_rating,
    text, text, text[], smallint, jsonb, jsonb)
from public, anon;

grant execute on function
  public.create_organization(text, boolean, text, text, text),
  public.create_invitation(uuid, public.invitation_type, uuid, text, interval),
  public.revoke_invitation(uuid),
  public.accept_invitation(text),
  public.record_lesson(uuid, uuid, date, smallint, smallint, smallint, smallint, public.performance_rating,
    text, text, text[], smallint, jsonb, jsonb)
to authenticated;
