-- Who can read and write phone numbers.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email, aud, role) values
  ('99999999-0000-0000-0000-000000000001', 'pc.admin@test.local', 'authenticated', 'authenticated'),
  ('99999999-0000-0000-0000-000000000002', 'pc.teacher@test.local', 'authenticated', 'authenticated'),
  ('99999999-0000-0000-0000-000000000003', 'pc.parent@test.local', 'authenticated', 'authenticated'),
  ('99999999-0000-0000-0000-000000000004', 'pc.teacher2@test.local', 'authenticated', 'authenticated');
insert into public.organizations (id, name) values ('99999999-0000-0000-0000-0000000000f1', 'PC Org');
insert into public.organization_memberships (organization_id, user_id, role) values
  ('99999999-0000-0000-0000-0000000000f1', '99999999-0000-0000-0000-000000000001', 'admin'),
  ('99999999-0000-0000-0000-0000000000f1', '99999999-0000-0000-0000-000000000002', 'teacher'),
  ('99999999-0000-0000-0000-0000000000f1', '99999999-0000-0000-0000-000000000004', 'teacher');
insert into public.classes (id, organization_id, name) values
  ('99999999-0000-0000-0000-0000000000c1', '99999999-0000-0000-0000-0000000000f1', 'A');
insert into public.class_teachers (organization_id, class_id, teacher_user_id) values
  ('99999999-0000-0000-0000-0000000000f1', '99999999-0000-0000-0000-0000000000c1', '99999999-0000-0000-0000-000000000002');
insert into public.students (id, organization_id, display_name) values
  ('99999999-0000-0000-0000-0000000000a1', '99999999-0000-0000-0000-0000000000f1', 'Kid');
insert into public.class_enrollments (organization_id, class_id, student_id) values
  ('99999999-0000-0000-0000-0000000000f1', '99999999-0000-0000-0000-0000000000c1', '99999999-0000-0000-0000-0000000000a1');
insert into public.parent_student_relationships (organization_id, student_id, parent_user_id, status) values
  ('99999999-0000-0000-0000-0000000000f1', '99999999-0000-0000-0000-0000000000a1', '99999999-0000-0000-0000-000000000003', 'verified');
insert into public.profile_contacts (user_id, phone) values
  ('99999999-0000-0000-0000-000000000002', '+1 604 555 0102'),
  ('99999999-0000-0000-0000-000000000003', '+1 604 555 0103');

-- The parent: can save their own number, cannot read the teacher's.
select set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select lives_ok($$ update public.profile_contacts set phone = '+1 604 555 0199' where user_id = '99999999-0000-0000-0000-000000000003' $$,
  'a person can change their own number');
select is((select count(*)::int from public.profile_contacts where user_id = '99999999-0000-0000-0000-000000000002'), 0,
  'parents cannot read staff numbers');
select throws_ok($$ insert into public.profile_contacts (user_id, phone) values ('99999999-0000-0000-0000-000000000004', '123456') $$,
  '42501', null, 'nobody can set someone else''s number');

-- The class teacher sees the parent; the other teacher does not.
reset role;
select set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select is((select phone from public.profile_contacts where user_id = '99999999-0000-0000-0000-000000000003'),
  '+1 604 555 0199', 'the child''s teacher sees the parent''s number');
reset role;
select set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.profile_contacts), 0,
  'a teacher of other classes sees no numbers');

-- The admin sees staff and parents.
reset role;
select set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.profile_contacts), 2, 'admins see staff and parent numbers');
select throws_ok($$ insert into public.profile_contacts (user_id, phone) values ('99999999-0000-0000-0000-000000000001', 'call me') $$,
  '23514', null, 'invalid phone numbers are rejected');

reset role;
select * from finish();
rollback;
