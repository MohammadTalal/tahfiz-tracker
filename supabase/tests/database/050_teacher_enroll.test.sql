-- Teachers can add students to their own classes only.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email, aud, role) values
  ('66666666-0000-0000-0000-000000000001', 'te.admin@test.local', 'authenticated', 'authenticated'),
  ('66666666-0000-0000-0000-000000000002', 'te.teacher@test.local', 'authenticated', 'authenticated');
insert into public.organizations (id, name) values ('66666666-0000-0000-0000-0000000000f1', 'TE Org');
insert into public.organization_memberships (organization_id, user_id, role) values
  ('66666666-0000-0000-0000-0000000000f1', '66666666-0000-0000-0000-000000000001', 'admin'),
  ('66666666-0000-0000-0000-0000000000f1', '66666666-0000-0000-0000-000000000002', 'teacher');
insert into public.classes (id, organization_id, name) values
  ('66666666-0000-0000-0000-0000000000c1', '66666666-0000-0000-0000-0000000000f1', 'Mine'),
  ('66666666-0000-0000-0000-0000000000c2', '66666666-0000-0000-0000-0000000000f1', 'Not mine');
insert into public.class_teachers (organization_id, class_id, teacher_user_id) values
  ('66666666-0000-0000-0000-0000000000f1', '66666666-0000-0000-0000-0000000000c1', '66666666-0000-0000-0000-000000000002');

select set_config('request.jwt.claims', '{"sub":"66666666-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;

select lives_ok($$ select public.enroll_new_student('66666666-0000-0000-0000-0000000000c1', 'Yusuf') $$,
  'a teacher can add a student to their own class');
select is((select count(*)::int from public.students where display_name = 'Yusuf'), 1,
  'and can then see that student');
select throws_ok($$ select public.enroll_new_student('66666666-0000-0000-0000-0000000000c2', 'Intruder') $$,
  '42501', null, 'a teacher cannot add a student to a class they do not teach');
select throws_ok($$
  insert into public.students (organization_id, display_name) values ('66666666-0000-0000-0000-0000000000f1', 'Direct')
$$, '42501', null, 'teachers still cannot insert students directly');

reset role;
select * from finish();
rollback;
