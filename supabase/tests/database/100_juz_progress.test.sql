-- student_juz_progress: current juz and the share of it memorized.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email, aud, role) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'jp.admin@test.local', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'jp.outsider@test.local', 'authenticated', 'authenticated');
insert into public.organizations (id, name) values ('bbbbbbbb-0000-0000-0000-0000000000f1', 'JP Org');
insert into public.organization_memberships (organization_id, user_id, role) values
  ('bbbbbbbb-0000-0000-0000-0000000000f1', 'bbbbbbbb-0000-0000-0000-000000000001', 'admin');
insert into public.students (id, organization_id, display_name) values
  ('bbbbbbbb-0000-0000-0000-0000000000a1', 'bbbbbbbb-0000-0000-0000-0000000000f1', 'Has lessons'),
  ('bbbbbbbb-0000-0000-0000-0000000000a2', 'bbbbbbbb-0000-0000-0000-0000000000f1', 'New');

-- Juz 30 is pages 582–604 (23 pages). An-Naba (78) is all of page 582
-- and 10 of the 25 ayahs on page 583: 1.4 pages, 1.4/23 ≈ 6%. A repeat and a
-- "not completed" lesson elsewhere in the juz change nothing.
insert into public.memorization_records (organization_id, student_id, teacher_user_id, lesson_date,
  start_surah, start_ayah, end_surah, end_ayah, performance_rating, idempotency_key, created_by)
values
  ('bbbbbbbb-0000-0000-0000-0000000000f1', 'bbbbbbbb-0000-0000-0000-0000000000a1', 'bbbbbbbb-0000-0000-0000-000000000001',
   current_date - 2, 78, 1, 78, 40, 'good', gen_random_uuid(), 'bbbbbbbb-0000-0000-0000-000000000001'),
  ('bbbbbbbb-0000-0000-0000-0000000000f1', 'bbbbbbbb-0000-0000-0000-0000000000a1', 'bbbbbbbb-0000-0000-0000-000000000001',
   current_date - 1, 78, 1, 78, 20, 'excellent', gen_random_uuid(), 'bbbbbbbb-0000-0000-0000-000000000001'),
  ('bbbbbbbb-0000-0000-0000-0000000000f1', 'bbbbbbbb-0000-0000-0000-0000000000a1', 'bbbbbbbb-0000-0000-0000-000000000001',
   current_date, 79, 1, 79, 46, 'not_completed', gen_random_uuid(), 'bbbbbbbb-0000-0000-0000-000000000001');

select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select is((select juz from public.student_juz_progress(array['bbbbbbbb-0000-0000-0000-0000000000a1']::uuid[])),
  30::smallint, 'the current juz comes from the last completed lesson');
select is((select percent from public.student_juz_progress(array['bbbbbbbb-0000-0000-0000-0000000000a1']::uuid[])),
  6::smallint, 'progress counts pages covered once, ignoring not-completed lessons');
select is((select count(*)::int from public.student_juz_progress(array['bbbbbbbb-0000-0000-0000-0000000000a2']::uuid[])),
  0, 'a student with no lessons or assignment has no current juz');

-- An open assignment decides the current juz.
reset role;
insert into public.assignments (organization_id, student_id, assigned_by, assignment_type,
  start_surah, start_ayah, end_surah, end_ayah, status, idempotency_key)
values ('bbbbbbbb-0000-0000-0000-0000000000f1', 'bbbbbbbb-0000-0000-0000-0000000000a2', 'bbbbbbbb-0000-0000-0000-000000000001',
  'memorization', 67, 1, 67, 5, 'assigned', gen_random_uuid());
set local role authenticated;
select is((select juz from public.student_juz_progress(array['bbbbbbbb-0000-0000-0000-0000000000a2']::uuid[])),
  29::smallint, 'the open memorization assignment sets the current juz');
select is((select percent from public.student_juz_progress(array['bbbbbbbb-0000-0000-0000-0000000000a2']::uuid[])),
  0::smallint, 'with nothing memorized yet');

-- Outsiders see nothing.
reset role;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.student_juz_progress(array['bbbbbbbb-0000-0000-0000-0000000000a1']::uuid[])),
  0, 'other users get no progress');

reset role;
select * from finish();
rollback;
