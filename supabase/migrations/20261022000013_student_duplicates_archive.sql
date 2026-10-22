-- Guard against accidental duplicate students and let admins archive one.

-- enroll_new_student gains p_allow_duplicate: without it, a name that matches
-- an active student of the organization (ignoring case and spaces) is refused
-- with 'duplicate_name' so the app can ask first.
drop function public.enroll_new_student(uuid, text);

create function public.enroll_new_student(
  p_class_id uuid,
  p_display_name text,
  p_allow_duplicate boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.managed_class_org(p_class_id);
  v_student uuid;
begin
  if v_org is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if char_length(trim(coalesce(p_display_name, ''))) not between 1 and 100 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;

  if not p_allow_duplicate and exists (
    select 1 from public.students s
    where s.organization_id = v_org
      and s.status = 'active'
      and lower(trim(s.display_name)) = lower(trim(p_display_name))
  ) then
    raise exception 'duplicate_name' using errcode = '23505';
  end if;

  v_student := gen_random_uuid();
  insert into public.students (id, organization_id, display_name)
  values (v_student, v_org, trim(p_display_name));

  insert into public.class_enrollments (organization_id, class_id, student_id)
  values (v_org, p_class_id, v_student);

  perform private.audit(v_org, 'student.enrolled', 'student', v_student,
    jsonb_build_object('class_id', p_class_id));
  return v_student;
end;
$$;

-- Archives a student (admins): ends their class and teacher links. Lessons,
-- assignments and parent links are kept as history.
create function public.archive_student(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from public.students where id = p_student_id and status = 'active';
  if v_org is null
     or not private.is_org_member(v_org, array['admin']::public.membership_role[]) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  update public.students set status = 'archived' where id = p_student_id;
  update public.class_enrollments set status = 'ended', end_date = current_date
  where student_id = p_student_id and status = 'active';
  update public.teacher_student_assignments set status = 'ended', end_date = current_date
  where student_id = p_student_id and status = 'active';

  perform private.audit(v_org, 'student.archived', 'student', p_student_id, '{}'::jsonb);
end;
$$;

revoke execute on function
  public.enroll_new_student(uuid, text, boolean),
  public.archive_student(uuid)
from public, anon;
grant execute on function
  public.enroll_new_student(uuid, text, boolean),
  public.archive_student(uuid)
to authenticated;
