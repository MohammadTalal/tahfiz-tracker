-- Unassigned students, enrolling an existing student and unlinking a student.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email, aud, role) values
  ('77777777-0000-0000-0000-000000000001', 'cm.admin@test.local', 'authenticated', 'authenticated'),
  ('77777777-0000-0000-0000-000000000002', 'cm.teacher@test.local', 'authenticated', 'authenticated');
insert into public.organizations (id, name) values
  ('77777777-0000-0000-0000-0000000000f1', 'CM Org'),
  ('77777777-0000-0000-0000-0000000000f2', 'Other Org');
insert into public.organization_memberships (organization_id, user_id, role) values
  ('77777777-0000-0000-0000-0000000000f1', '77777777-0000-0000-0000-000000000001', 'admin'),
  ('77777777-0000-0000-0000-0000000000f1', '77777777-0000-0000-0000-000000000002', 'teacher');
insert into public.classes (id, organization_id, name) values
  ('77777777-0000-0000-0000-0000000000c1', '77777777-0000-0000-0000-0000000000f1', 'Mine'),
  ('77777777-0000-0000-0000-0000000000c2', '77777777-0000-0000-0000-0000000000f1', 'Not mine');
insert into public.class_teachers (organization_id, class_id, teacher_user_id) values
  ('77777777-0000-0000-0000-0000000000f1', '77777777-0000-0000-0000-0000000000c1', '77777777-0000-0000-0000-000000000002');
insert into public.students (id, organization_id, display_name) values
  ('77777777-0000-0000-0000-0000000000a1', '77777777-0000-0000-0000-0000000000f1', 'Free'),
  ('77777777-0000-0000-0000-0000000000a2', '77777777-0000-0000-0000-0000000000f1', 'Placed'),
  ('77777777-0000-0000-0000-0000000000a3', '77777777-0000-0000-0000-0000000000f2', 'Elsewhere');
insert into public.class_enrollments (organization_id, class_id, student_id) values
  ('77777777-0000-0000-0000-0000000000f1', '77777777-0000-0000-0000-0000000000c2', '77777777-0000-0000-0000-0000000000a2');

-- As the class teacher: roster changes are refused, even for their own class.
select set_config('request.jwt.claims', '{"sub":"77777777-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;

select throws_ok($$ select public.unassigned_students('77777777-0000-0000-0000-0000000000c1') $$,
  '42501', null, 'a teacher cannot list students without a class');
select throws_ok($$ select public.enroll_existing_student('77777777-0000-0000-0000-0000000000c1', '77777777-0000-0000-0000-0000000000a1') $$,
  '42501', null, 'a teacher cannot add a student to their class');
select throws_ok($$ select public.unenroll_student('77777777-0000-0000-0000-0000000000c2', '77777777-0000-0000-0000-0000000000a2') $$,
  '42501', null, 'a teacher cannot unlink a student');

-- As the admin.
reset role;
select set_config('request.jwt.claims', '{"sub":"77777777-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select results_eq(
  $$ select display_name from public.unassigned_students('77777777-0000-0000-0000-0000000000c1') $$,
  $$ values ('Free'::text) $$,
  'lists only students of the organization without a class');
select lives_ok($$ select public.enroll_existing_student('77777777-0000-0000-0000-0000000000c1', '77777777-0000-0000-0000-0000000000a1') $$,
  'an admin adds an unassigned student to a class');
select is((select count(*)::int from public.unassigned_students('77777777-0000-0000-0000-0000000000c1')), 0,
  'and the student is no longer unassigned');
select throws_ok($$ select public.enroll_existing_student('77777777-0000-0000-0000-0000000000c1', '77777777-0000-0000-0000-0000000000a2') $$,
  '22023', null, 'a student already in a class cannot be added');
select throws_ok($$ select public.enroll_existing_student('77777777-0000-0000-0000-0000000000c1', '77777777-0000-0000-0000-0000000000a3') $$,
  '22023', null, 'a student of another organization cannot be added');
select lives_ok($$ select public.unenroll_student('77777777-0000-0000-0000-0000000000c1', '77777777-0000-0000-0000-0000000000a1') $$,
  'an admin unlinks a student from a class');

reset role;
select is(
  (select status::text from public.class_enrollments where student_id = '77777777-0000-0000-0000-0000000000a1'),
  'ended', 'unlinking ends the enrollment and keeps the student');

select * from finish();
rollback;
