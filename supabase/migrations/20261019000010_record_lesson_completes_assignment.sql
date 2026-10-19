-- record_lesson can now close the memorization assignment the lesson was for.
-- A good result marks it teacher_verified; "needs improvement" or "not
-- completed" marks it needs_practice (it stays open and is suggested again).

drop function public.record_lesson(uuid, uuid, date, smallint, smallint, smallint, smallint,
  public.performance_rating, text, text, text[], smallint, jsonb, jsonb);

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
  p_next_revisions jsonb default '[]'::jsonb,
  p_completes_assignment_id uuid default null
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

  if p_completes_assignment_id is not null then
    update public.assignments
    set status = case
          when p_performance_rating in ('needs_improvement', 'not_completed') then 'needs_practice'
          else 'teacher_verified'
        end::public.assignment_status
    where id = p_completes_assignment_id
      and student_id = p_student_id
      and assignment_type = 'memorization'
      and status in ('assigned', 'in_progress', 'student_reported', 'needs_practice');
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

revoke execute on function public.record_lesson(uuid, uuid, date, smallint, smallint, smallint, smallint,
  public.performance_rating, text, text, text[], smallint, jsonb, jsonb, uuid) from public, anon;
grant execute on function public.record_lesson(uuid, uuid, date, smallint, smallint, smallint, smallint,
  public.performance_rating, text, text, text[], smallint, jsonb, jsonb, uuid) to authenticated;
