-- Atomic helpers for the admin screens. Both run as the caller (RLS applies).

-- Create a class. If the caller is also a teacher in the organization (e.g. a
-- solo teacher), they are assigned to the class in the same step.
create function public.create_class(p_organization_id uuid, p_name text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_class uuid;
begin
  insert into public.classes (organization_id, name)
  values (p_organization_id, trim(p_name))
  returning id into v_class;

  if private.user_has_role(p_organization_id, v_user, 'teacher') then
    insert into public.class_teachers (organization_id, class_id, teacher_user_id)
    values (p_organization_id, v_class, v_user);
  end if;

  return v_class;
end;
$$;

-- Add a new student and enroll them in a class of the same organization.
create function public.enroll_new_student(p_class_id uuid, p_display_name text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_org uuid;
  v_student uuid;
begin
  select organization_id into v_org from public.classes where id = p_class_id and status = 'active';
  if v_org is null then
    raise exception 'class_not_found' using errcode = '42501';
  end if;

  -- No RETURNING: the students SELECT policy looks the row up by id, and a new
  -- row is not yet visible to that check. Generate the id here instead.
  v_student := gen_random_uuid();
  insert into public.students (id, organization_id, display_name)
  values (v_student, v_org, trim(p_display_name));

  insert into public.class_enrollments (organization_id, class_id, student_id)
  values (v_org, p_class_id, v_student);

  return v_student;
end;
$$;

revoke execute on function public.create_class(uuid, text), public.enroll_new_student(uuid, text) from public, anon;
grant execute on function public.create_class(uuid, text), public.enroll_new_student(uuid, text) to authenticated;
