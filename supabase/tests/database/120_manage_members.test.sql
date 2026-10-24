-- Making a teacher admin, taking admin away, removing a member, and direct student assignments.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email, aud, role) values
  ('dddddddd-0000-0000-0000-000000000001', 'mm.admin@test.local', 'authenticated', 'authenticated'),
  ('dddddddd-0000-0000-0000-000000000002', 'mm.teacher@test.local', 'authenticated', 'authenticated');
insert into public.organizations (id, name) values ('dddddddd-0000-0000-0000-0000000000f1', 'MM Org');
insert into public.organization_memberships (organization_id, user_id, role) values
  ('dddddddd-0000-0000-0000-0000000000f1', 'dddddddd-0000-0000-0000-000000000001', 'admin'),
  ('dddddddd-0000-0000-0000-0000000000f1', 'dddddddd-0000-0000-0000-000000000002', 'teacher');
insert into public.classes (id, organization_id, name) values
  ('dddddddd-0000-0000-0000-0000000000c1', 'dddddddd-0000-0000-0000-0000000000f1', 'A');
insert into public.class_teachers (organization_id, class_id, teacher_user_id) values
  ('dddddddd-0000-0000-0000-0000000000f1', 'dddddddd-0000-0000-0000-0000000000c1', 'dddddddd-0000-0000-0000-000000000002');
insert into public.students (id, organization_id, display_name) values
  ('dddddddd-0000-0000-0000-0000000000a1', 'dddddddd-0000-0000-0000-0000000000f1', 'Solo');

-- As the admin.
select set_config('request.jwt.claims', '{"sub":"dddddddd-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select lives_ok($$ insert into public.teacher_student_assignments (organization_id, teacher_user_id, student_id)
  values ('dddddddd-0000-0000-0000-0000000000f1', 'dddddddd-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-0000000000a1') $$,
  'an admin assigns a student directly to a teacher');
select throws_ok($$ select public.set_member_admin('dddddddd-0000-0000-0000-0000000000f1', 'dddddddd-0000-0000-0000-000000000001', false) $$,
  '22023', 'cannot_change_self', 'an admin cannot demote themselves');
select lives_ok($$ select public.set_member_admin('dddddddd-0000-0000-0000-0000000000f1', 'dddddddd-0000-0000-0000-000000000002', true) $$,
  'an admin makes a teacher an admin');
select is((select count(*)::int from public.organization_memberships
  where organization_id = 'dddddddd-0000-0000-0000-0000000000f1' and role = 'admin' and status = 'active'), 2,
  'there are now two admins');
select lives_ok($$ select public.set_member_admin('dddddddd-0000-0000-0000-0000000000f1', 'dddddddd-0000-0000-0000-000000000002', false) $$,
  'and can take admin away again');
select throws_ok($$ select public.remove_member('dddddddd-0000-0000-0000-0000000000f1', 'dddddddd-0000-0000-0000-000000000001') $$,
  '22023', 'cannot_change_self', 'an admin cannot remove themselves');

-- The teacher sees the student through the direct assignment.
reset role;
select set_config('request.jwt.claims', '{"sub":"dddddddd-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.students where id = 'dddddddd-0000-0000-0000-0000000000a1'), 1,
  'a directly assigned student is visible to the teacher');
select throws_ok($$ select public.remove_member('dddddddd-0000-0000-0000-0000000000f1', 'dddddddd-0000-0000-0000-000000000001') $$,
  '42501', null, 'teachers cannot remove members');

-- The admin removes the teacher.
reset role;
select set_config('request.jwt.claims', '{"sub":"dddddddd-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok($$ select public.remove_member('dddddddd-0000-0000-0000-0000000000f1', 'dddddddd-0000-0000-0000-000000000002') $$,
  'an admin removes a teacher');

-- The removed teacher sees nothing of the organization.
reset role;
select set_config('request.jwt.claims', '{"sub":"dddddddd-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.organizations where id = 'dddddddd-0000-0000-0000-0000000000f1'), 0,
  'a removed teacher no longer sees the organization');
select is((select count(*)::int from public.students where organization_id = 'dddddddd-0000-0000-0000-0000000000f1'), 0,
  'nor its students');
reset role;
select is((select count(*)::int from public.class_teachers where teacher_user_id = 'dddddddd-0000-0000-0000-000000000002'), 0,
  'and they left their classes');

select * from finish();
rollback;
