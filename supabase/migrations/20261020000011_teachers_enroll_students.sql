-- Teachers may add new students to classes they teach (admins: any class).
-- SECURITY DEFINER so the table policies can stay admin-only; the function
-- performs the permission check itself.

create or replace function public.enroll_new_student(p_class_id uuid, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_org uuid;
  v_student uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select organization_id into v_org from public.classes where id = p_class_id and status = 'active';
  if v_org is null
     or not (
       private.is_org_member(v_org, array['admin']::public.membership_role[])
       or (
         private.is_org_member(v_org, array['teacher']::public.membership_role[])
         and exists (
           select 1 from public.class_teachers ct
           where ct.class_id = p_class_id and ct.teacher_user_id = v_user
         )
       )
     ) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if char_length(trim(coalesce(p_display_name, ''))) not between 1 and 100 then
    raise exception 'invalid_name' using errcode = '22023';
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

revoke execute on function public.enroll_new_student(uuid, text) from public, anon;
grant execute on function public.enroll_new_student(uuid, text) to authenticated;
