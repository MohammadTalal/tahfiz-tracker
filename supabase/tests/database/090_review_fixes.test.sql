-- Admin-only student edits, student_progress, and phone numbers with a country code.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'rf.admin@test.local', 'authenticated', 'authenticated'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'rf.teacher@test.local', 'authenticated', 'authenticated');
insert into public.organizations (id, name) values ('aaaaaaaa-0000-0000-0000-0000000000f1', 'RF Org');
insert into public.organization_memberships (organization_id, user_id, role) values
  ('aaaaaaaa-0000-0000-0000-0000000000f1', 'aaaaaaaa-0000-0000-0000-000000000001', 'admin'),
  ('aaaaaaaa-0000-0000-0000-0000000000f1', 'aaaaaaaa-0000-0000-0000-000000000002', 'teacher');
insert into public.classes (id, organization_id, name) values
  ('aaaaaaaa-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-0000000000f1', 'A');
insert into public.class_teachers (organization_id, class_id, teacher_user_id) values
  ('aaaaaaaa-0000-0000-0000-0000000000f1', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-000000000002');
insert into public.students (id, organization_id, display_name) values
  ('aaaaaaaa-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-0000000000f1', 'Kid');
insert into public.class_enrollments (organization_id, class_id, student_id) values
  ('aaaaaaaa-0000-0000-0000-0000000000f1', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-0000000000a1');
insert into public.memorization_records (organization_id, student_id, teacher_user_id, lesson_date,
  start_surah, start_ayah, end_surah, end_ayah, performance_rating, idempotency_key, created_by)
values
  ('aaaaaaaa-0000-0000-0000-0000000000f1', 'aaaaaaaa-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-000000000002',
   current_date - 3, 67, 1, 67, 5, 'good', gen_random_uuid(), 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('aaaaaaaa-0000-0000-0000-0000000000f1', 'aaaaaaaa-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-000000000002',
   current_date, 67, 6, 67, 10, 'excellent', gen_random_uuid(), 'aaaaaaaa-0000-0000-0000-000000000002');

-- As the class teacher.
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;

update public.students set status = 'archived' where id = 'aaaaaaaa-0000-0000-0000-0000000000a1';
reset role;
select is((select status::text from public.students where id = 'aaaaaaaa-0000-0000-0000-0000000000a1'), 'active',
  'a teacher cannot archive (or edit) a student directly');
set local role authenticated;

select is((select last_rating::text from public.student_progress(array['aaaaaaaa-0000-0000-0000-0000000000a1']::uuid[])),
  'excellent', 'student_progress returns the latest lesson');
select is((select count(*)::int from public.student_progress(array['aaaaaaaa-0000-0000-0000-0000000000a1']::uuid[])
  where last_lesson_date = current_date), 1, 'with its date');

-- Phone numbers need a country code.
select throws_ok($$ insert into public.profile_contacts (user_id, phone) values ('aaaaaaaa-0000-0000-0000-000000000002', '0791234567') $$,
  '23514', null, 'a local number without a country code is rejected');
select lives_ok($$ insert into public.profile_contacts (user_id, phone) values ('aaaaaaaa-0000-0000-0000-000000000002', '+962 79 123 4567') $$,
  'an international number is accepted');

-- As the admin.
reset role;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok($$ update public.students set display_name = 'Kid A' where id = 'aaaaaaaa-0000-0000-0000-0000000000a1' $$,
  'admins can edit a student');
reset role;
select is((select display_name from public.students where id = 'aaaaaaaa-0000-0000-0000-0000000000a1'), 'Kid A',
  'and the change is saved');

select * from finish();
rollback;
