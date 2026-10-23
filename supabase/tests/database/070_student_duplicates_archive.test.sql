-- Duplicate-name guard on enroll_new_student, and archive_student.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email, aud, role) values
  ('88888888-0000-0000-0000-000000000001', 'da.admin@test.local', 'authenticated', 'authenticated'),
  ('88888888-0000-0000-0000-000000000002', 'da.teacher@test.local', 'authenticated', 'authenticated');
insert into public.organizations (id, name) values ('88888888-0000-0000-0000-0000000000f1', 'DA Org');
insert into public.organization_memberships (organization_id, user_id, role) values
  ('88888888-0000-0000-0000-0000000000f1', '88888888-0000-0000-0000-000000000001', 'admin'),
  ('88888888-0000-0000-0000-0000000000f1', '88888888-0000-0000-0000-000000000002', 'teacher');
insert into public.classes (id, organization_id, name) values
  ('88888888-0000-0000-0000-0000000000c1', '88888888-0000-0000-0000-0000000000f1', 'A');
insert into public.class_teachers (organization_id, class_id, teacher_user_id) values
  ('88888888-0000-0000-0000-0000000000f1', '88888888-0000-0000-0000-0000000000c1', '88888888-0000-0000-0000-000000000002');
insert into public.students (id, organization_id, display_name) values
  ('88888888-0000-0000-0000-0000000000a1', '88888888-0000-0000-0000-0000000000f1', 'Nada');
insert into public.class_enrollments (organization_id, class_id, student_id) values
  ('88888888-0000-0000-0000-0000000000f1', '88888888-0000-0000-0000-0000000000c1', '88888888-0000-0000-0000-0000000000a1');

-- As the teacher.
select set_config('request.jwt.claims', '{"sub":"88888888-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;

select throws_ok($$ select public.archive_student('88888888-0000-0000-0000-0000000000a1') $$,
  '42501', null, 'teachers cannot archive students');

-- As the admin.
reset role;
select set_config('request.jwt.claims', '{"sub":"88888888-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select throws_ok($$ select public.enroll_new_student('88888888-0000-0000-0000-0000000000c1', ' nada ') $$,
  '23505', 'duplicate_name', 'a matching name is refused by default');
select lives_ok($$ select public.enroll_new_student('88888888-0000-0000-0000-0000000000c1', 'Nada', true) $$,
  'and allowed when confirmed');

select lives_ok($$ select public.archive_student('88888888-0000-0000-0000-0000000000a1') $$,
  'admins can archive a student');
select is((select status::text from public.students where id = '88888888-0000-0000-0000-0000000000a1'),
  'archived', 'the student is archived');
select is((select count(*)::int from public.class_enrollments
  where student_id = '88888888-0000-0000-0000-0000000000a1' and status = 'active'), 0,
  'and no longer in a class');
select is((select count(*)::int from public.unassigned_students('88888888-0000-0000-0000-0000000000c1')), 0,
  'archived students are not offered as unassigned');
select throws_ok($$ select public.archive_student('88888888-0000-0000-0000-0000000000a1') $$,
  '42501', null, 'an archived student cannot be archived again');

reset role;
select * from finish();
rollback;
