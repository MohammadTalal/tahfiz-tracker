-- record_lesson closes the memorization assignment the lesson was for.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email, aud, role) values
  ('55555555-0000-0000-0000-000000000001', 'rl.teacher@test.local', 'authenticated', 'authenticated');
insert into public.organizations (id, name) values ('55555555-0000-0000-0000-0000000000f1', 'RL Org');
insert into public.organization_memberships (organization_id, user_id, role) values
  ('55555555-0000-0000-0000-0000000000f1', '55555555-0000-0000-0000-000000000001', 'admin');
insert into public.students (id, organization_id, display_name) values
  ('55555555-0000-0000-0000-0000000000a1', '55555555-0000-0000-0000-0000000000f1', 'RL Student');
insert into public.assignments (id, organization_id, student_id, assigned_by, assignment_type,
  start_surah, start_ayah, end_surah, end_ayah, idempotency_key) values
  ('55555555-0000-0000-0000-0000000000b1', '55555555-0000-0000-0000-0000000000f1', '55555555-0000-0000-0000-0000000000a1',
   '55555555-0000-0000-0000-000000000001', 'memorization', 67, 6, 67, 10, gen_random_uuid()),
  ('55555555-0000-0000-0000-0000000000b2', '55555555-0000-0000-0000-0000000000f1', '55555555-0000-0000-0000-0000000000a1',
   '55555555-0000-0000-0000-000000000001', 'memorization', 67, 11, 67, 15, gen_random_uuid());

select set_config('request.jwt.claims', '{"sub":"55555555-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select public.record_lesson('55555555-0000-0000-0000-0000000000a1', gen_random_uuid(), current_date,
  67::smallint, 6::smallint, 67::smallint, 10::smallint, 'very_good',
  p_completes_assignment_id => '55555555-0000-0000-0000-0000000000b1');
select is((select status::text from public.assignments where id = '55555555-0000-0000-0000-0000000000b1'),
  'teacher_verified', 'a good lesson verifies the assignment');
select isnt((select teacher_verified_at from public.assignments where id = '55555555-0000-0000-0000-0000000000b1'),
  null, 'and stamps when it was verified');

select public.record_lesson('55555555-0000-0000-0000-0000000000a1', gen_random_uuid(), current_date,
  67::smallint, 11::smallint, 67::smallint, 15::smallint, 'needs_improvement',
  p_completes_assignment_id => '55555555-0000-0000-0000-0000000000b2');
select is((select status::text from public.assignments where id = '55555555-0000-0000-0000-0000000000b2'),
  'needs_practice', 'a weak lesson marks the assignment as needing practice');

select public.record_lesson('55555555-0000-0000-0000-0000000000a1', gen_random_uuid(), current_date,
  67::smallint, 11::smallint, 67::smallint, 15::smallint, 'excellent',
  p_completes_assignment_id => '55555555-0000-0000-0000-0000000000b2');
select is((select status::text from public.assignments where id = '55555555-0000-0000-0000-0000000000b2'),
  'teacher_verified', 'repeating it well later verifies it');

reset role;
select * from finish();
rollback;
