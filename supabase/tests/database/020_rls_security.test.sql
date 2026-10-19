-- Security tests from docs/security.md §6. Every unauthorized attempt must fail.
--
-- Fixtures (inserted as the superuser, bypassing RLS):
--   Org A: admin, teacher (class A1 with student S1), teacher2 (class A2 with student S2),
--          parent of S1. Lesson R1 for S1 with a private note.
--   Org B: admin, teacher (class B1 with student SB1). Lesson RB1 for SB1.
--   Outsider: signed-in user with no memberships.
begin;
create extension if not exists pgtap with schema extensions;
select plan(43);

-- Switch the simulated user. Call while running as the superuser, then
-- `set local role authenticated`.
create function pg_temp.claims(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object(
    'sub', p_user, 'role', 'authenticated',
    'email', (select email from auth.users where id = p_user))::text, true);
$$;

insert into auth.users (id, email, aud, role) values
  ('11111111-0000-0000-0000-000000000001', 'a.admin@test.local', 'authenticated', 'authenticated'),
  ('11111111-0000-0000-0000-000000000002', 'a.teacher@test.local', 'authenticated', 'authenticated'),
  ('11111111-0000-0000-0000-000000000003', 'a.teacher2@test.local', 'authenticated', 'authenticated'),
  ('11111111-0000-0000-0000-000000000004', 'a.parent@test.local', 'authenticated', 'authenticated'),
  ('22222222-0000-0000-0000-000000000001', 'b.admin@test.local', 'authenticated', 'authenticated'),
  ('22222222-0000-0000-0000-000000000002', 'b.teacher@test.local', 'authenticated', 'authenticated'),
  ('33333333-0000-0000-0000-000000000001', 'outsider@test.local', 'authenticated', 'authenticated'),
  ('33333333-0000-0000-0000-000000000002', 'outsider2@test.local', 'authenticated', 'authenticated');

insert into public.organizations (id, name) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Org A'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Org B');

insert into public.organization_memberships (organization_id, user_id, role) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'admin'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 'teacher'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 'teacher'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'admin'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', 'teacher');

insert into public.classes (id, organization_id, name) values
  ('aaaaaaaa-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-000000000001', 'A1'),
  ('aaaaaaaa-0000-0000-0000-0000000000c2', 'aaaaaaaa-0000-0000-0000-000000000001', 'A2'),
  ('bbbbbbbb-0000-0000-0000-0000000000c1', 'bbbbbbbb-0000-0000-0000-000000000001', 'B1');

insert into public.class_teachers (organization_id, class_id, teacher_user_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-0000000000c1', '11111111-0000-0000-0000-000000000002'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-0000000000c2', '11111111-0000-0000-0000-000000000003'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-0000000000c1', '22222222-0000-0000-0000-000000000002');

insert into public.students (id, organization_id, display_name) values
  ('aaaaaaaa-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-000000000001', 'S1'),
  ('aaaaaaaa-0000-0000-0000-0000000000a2', 'aaaaaaaa-0000-0000-0000-000000000001', 'S2'),
  ('bbbbbbbb-0000-0000-0000-0000000000b1', 'bbbbbbbb-0000-0000-0000-000000000001', 'SB1');

insert into public.class_enrollments (organization_id, class_id, student_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-0000000000a1'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-0000000000c2', 'aaaaaaaa-0000-0000-0000-0000000000a2'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-0000000000c1', 'bbbbbbbb-0000-0000-0000-0000000000b1');

insert into public.parent_student_relationships (organization_id, parent_user_id, student_id, status) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-0000000000a1', 'verified');

insert into public.memorization_records (id, organization_id, student_id, teacher_user_id, lesson_date,
  start_surah, start_ayah, end_surah, end_ayah, performance_rating, parent_visible_feedback, idempotency_key, created_by)
values
  ('aaaaaaaa-0000-0000-0000-0000000000d1', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-0000000000a1',
   '11111111-0000-0000-0000-000000000002', current_date, 67, 1, 67, 5, 'good', 'Well done', gen_random_uuid(),
   '11111111-0000-0000-0000-000000000002'),
  ('bbbbbbbb-0000-0000-0000-0000000000d1', 'bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-0000000000b1',
   '22222222-0000-0000-0000-000000000002', current_date, 1, 1, 1, 7, 'excellent', null, gen_random_uuid(),
   '22222222-0000-0000-0000-000000000002');

insert into public.memorization_record_private_notes (record_id, organization_id, body, updated_by) values
  ('aaaaaaaa-0000-0000-0000-0000000000d1', 'aaaaaaaa-0000-0000-0000-000000000001', 'Teacher-only note',
   '11111111-0000-0000-0000-000000000002');

-- Holds invitation tokens across role switches.
create temp table tokens (name text primary key, token text not null);
grant all on tokens to authenticated;

------------------------------------------------------------------------------
-- Positive controls: the right people DO see the right data.
------------------------------------------------------------------------------
select pg_temp.claims('11111111-0000-0000-0000-000000000002');
set local role authenticated;
select is((select count(*)::int from public.students), 1, 'teacher A sees only their own student');
select is((select count(*)::int from public.memorization_record_private_notes), 1, 'teacher A sees the private note');

reset role;
select pg_temp.claims('11111111-0000-0000-0000-000000000001');
set local role authenticated;
select is((select count(*)::int from public.students), 2, 'admin A sees all org A students');

reset role;
select pg_temp.claims('11111111-0000-0000-0000-000000000004');
set local role authenticated;
select is((select count(*)::int from public.students), 1, 'parent sees their linked child');
select is((select count(*)::int from public.memorization_records), 1, 'parent sees the child''s lesson');
select is((select parent_visible_feedback from public.memorization_records), 'Well done', 'parent sees parent feedback');

------------------------------------------------------------------------------
-- 1-3: cross-org and unassigned teacher access
------------------------------------------------------------------------------
reset role;
select pg_temp.claims('11111111-0000-0000-0000-000000000002');
set local role authenticated;
select is_empty($$ select id from public.students where organization_id = 'bbbbbbbb-0000-0000-0000-000000000001' $$,
  '1. teacher A cannot read org B students');
select is_empty($$ select id from public.memorization_records where organization_id = 'bbbbbbbb-0000-0000-0000-000000000001' $$,
  '1b. teacher A cannot read org B lessons');
select throws_ok($$
  insert into public.memorization_records (organization_id, student_id, teacher_user_id, lesson_date,
    start_surah, start_ayah, end_surah, end_ayah, performance_rating, idempotency_key, created_by)
  values ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-0000000000b1',
    '11111111-0000-0000-0000-000000000002', current_date, 1, 1, 1, 7, 'good', gen_random_uuid(),
    '11111111-0000-0000-0000-000000000002')
$$, '42501', null, '2. teacher A cannot insert a lesson for an org B student');
select throws_ok($$
  insert into public.memorization_records (organization_id, student_id, teacher_user_id, lesson_date,
    start_surah, start_ayah, end_surah, end_ayah, performance_rating, idempotency_key, created_by)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-0000000000b1',
    '11111111-0000-0000-0000-000000000002', current_date, 1, 1, 1, 7, 'good', gen_random_uuid(),
    '11111111-0000-0000-0000-000000000002')
$$, null, null, '2b. a lesson cannot claim org A for an org B student');
select throws_ok($$
  insert into public.memorization_records (organization_id, student_id, teacher_user_id, lesson_date,
    start_surah, start_ayah, end_surah, end_ayah, performance_rating, idempotency_key, created_by)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-0000000000a1',
    '11111111-0000-0000-0000-000000000003', current_date, 1, 1, 1, 7, 'good', gen_random_uuid(),
    '11111111-0000-0000-0000-000000000003')
$$, '42501', null, '2c. teacher A cannot record a lesson under another teacher''s name');

reset role;
select pg_temp.claims('11111111-0000-0000-0000-000000000003');
set local role authenticated;
select is_empty($$ select id from public.students where id = 'aaaaaaaa-0000-0000-0000-0000000000a1' $$,
  '3. an unassigned teacher in the same org cannot read the student');
select is_empty($$ select record_id from public.memorization_record_private_notes $$,
  '3b. an unassigned teacher cannot read other students'' private notes');

------------------------------------------------------------------------------
-- 4-6: parent boundaries
------------------------------------------------------------------------------
reset role;
select pg_temp.claims('11111111-0000-0000-0000-000000000004');
set local role authenticated;
select is_empty($$ select id from public.students where id = 'aaaaaaaa-0000-0000-0000-0000000000a2' $$,
  '4. parent cannot read a non-linked student by guessed id');
select is_empty($$ select record_id from public.memorization_record_private_notes $$,
  '5. parent cannot read teacher private notes');
select is_empty($$ select id from public.student_private_notes $$, '5b. parent cannot read student private notes');
select is_empty($$ select id from public.memorization_record_history $$, '5c. parent cannot read record history');
update public.memorization_records set performance_rating = 'excellent'
  where id = 'aaaaaaaa-0000-0000-0000-0000000000d1';
select throws_ok($$
  insert into public.assignments (organization_id, student_id, assigned_by, assignment_type,
    start_surah, start_ayah, end_surah, end_ayah, idempotency_key)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-0000000000a1',
    '11111111-0000-0000-0000-000000000004', 'memorization', 67, 6, 67, 10, gen_random_uuid())
$$, '42501', null, '6b. parent cannot create assignments');

reset role;
select is((select performance_rating::text from public.memorization_records where id = 'aaaaaaaa-0000-0000-0000-0000000000d1'),
  'good', '6. parent update of a teacher assessment had no effect');

------------------------------------------------------------------------------
-- 7: no self-escalation
------------------------------------------------------------------------------
select pg_temp.claims('11111111-0000-0000-0000-000000000002');
set local role authenticated;
select throws_ok($$
  insert into public.organization_memberships (organization_id, user_id, role)
  values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 'admin')
$$, '42501', null, '7. teacher cannot make themself admin');
update public.organization_memberships set role = 'admin' where user_id = '11111111-0000-0000-0000-000000000002';
select throws_ok($$
  insert into public.organization_memberships (organization_id, user_id, role)
  values ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 'teacher')
$$, '42501', null, '7c. teacher cannot join another organization directly');
select throws_ok($$ select public.create_invitation('aaaaaaaa-0000-0000-0000-000000000001', 'teacher') $$,
  '42501', null, '7d. teacher cannot invite teachers (admin only)');
select throws_ok($$ select public.create_invitation('bbbbbbbb-0000-0000-0000-000000000001', 'parent',
  'bbbbbbbb-0000-0000-0000-0000000000b1') $$, '42501', null, '7e. teacher cannot invite parents in another org');

reset role;
select is((select count(*)::int from public.organization_memberships
  where user_id = '11111111-0000-0000-0000-000000000002' and role = 'admin'), 0,
  '7b. teacher role update had no effect');

select pg_temp.claims('11111111-0000-0000-0000-000000000001');
set local role authenticated;
select throws_ok($$
  insert into public.class_teachers (organization_id, class_id, teacher_user_id)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-0000000000c1', '22222222-0000-0000-0000-000000000002')
$$, '42501', null, '7f. admin A cannot assign an org B teacher to an org A class');

------------------------------------------------------------------------------
-- 8-10: invitations
------------------------------------------------------------------------------
insert into tokens values
  ('expired', public.create_invitation('aaaaaaaa-0000-0000-0000-000000000001', 'parent', 'aaaaaaaa-0000-0000-0000-0000000000a2')),
  ('revoked', public.create_invitation('aaaaaaaa-0000-0000-0000-000000000001', 'parent', 'aaaaaaaa-0000-0000-0000-0000000000a2')),
  ('good',    public.create_invitation('aaaaaaaa-0000-0000-0000-000000000001', 'parent', 'aaaaaaaa-0000-0000-0000-0000000000a2')),
  ('teacher', public.create_invitation('aaaaaaaa-0000-0000-0000-000000000001', 'teacher', null, 'someone.else@test.local'));
select is((select count(*)::int from tokens where length(token) = 64), 4, 'admin can create invitations');
select throws_ok($$ select token_hash from public.invitations $$, '42501', null,
  'token hashes are not readable');

reset role;
update public.invitations set expires_at = now() - interval '1 minute'
  where token_hash = sha256(convert_to((select token from tokens where name = 'expired'), 'UTF8'));
update public.invitations set revoked_at = now()
  where token_hash = sha256(convert_to((select token from tokens where name = 'revoked'), 'UTF8'));

select pg_temp.claims('33333333-0000-0000-0000-000000000001');
set local role authenticated;
select throws_ok($$ select public.accept_invitation((select token from tokens where name = 'expired')) $$,
  '22023', 'invalid_invitation', '8. expired invitation is rejected');
select throws_ok($$ select public.accept_invitation((select token from tokens where name = 'revoked')) $$,
  '22023', 'invalid_invitation', '9. revoked invitation is rejected');
select throws_ok($$ select public.accept_invitation('not-a-real-token') $$,
  '22023', 'invalid_invitation', 'unknown token is rejected');
select throws_ok($$ select public.accept_invitation((select token from tokens where name = 'teacher')) $$,
  '22023', 'invalid_invitation', 'email-bound invitation is rejected for a different email');
select lives_ok($$ select public.accept_invitation((select token from tokens where name = 'good')) $$,
  '10a. valid invitation is accepted');
select is((select count(*)::int from public.students), 1, '10b. new parent now sees exactly the invited child');

reset role;
select pg_temp.claims('33333333-0000-0000-0000-000000000002');
set local role authenticated;
select throws_ok($$ select public.accept_invitation((select token from tokens where name = 'good')) $$,
  '22023', 'invalid_invitation', '10. the same invitation cannot be used twice');

------------------------------------------------------------------------------
-- 14-15: passage validation and idempotency
------------------------------------------------------------------------------
reset role;
select pg_temp.claims('11111111-0000-0000-0000-000000000002');
set local role authenticated;
select throws_ok($$
  select public.record_lesson('aaaaaaaa-0000-0000-0000-0000000000a1', gen_random_uuid(), current_date,
    67::smallint, 1::smallint, 67::smallint, 31::smallint, 'good')
$$, '23503', null, '14. ayah beyond the surah length is rejected');
select throws_ok($$
  select public.record_lesson('aaaaaaaa-0000-0000-0000-0000000000a1', gen_random_uuid(), current_date,
    67::smallint, 10::smallint, 67::smallint, 5::smallint, 'good')
$$, '23514', null, '14b. passage ending before it starts is rejected');
select lives_ok($$
  select public.record_lesson('aaaaaaaa-0000-0000-0000-0000000000a1', '99999999-0000-0000-0000-000000000001',
    current_date, 78::smallint, 1::smallint, 114::smallint, 6::smallint, 'very_good',
    p_next_revisions => '[{"start_surah":1,"start_ayah":1,"end_surah":1,"end_ayah":7}]')
$$, '14c. a cross-surah passage (Juz 30) is accepted');
select public.record_lesson('aaaaaaaa-0000-0000-0000-0000000000a1', '99999999-0000-0000-0000-000000000001',
  current_date, 78::smallint, 1::smallint, 114::smallint, 6::smallint, 'very_good',
  p_next_revisions => '[{"start_surah":1,"start_ayah":1,"end_surah":1,"end_ayah":7}]');
select is((select count(*)::int from public.memorization_records where idempotency_key = '99999999-0000-0000-0000-000000000001'),
  1, '15. saving the same lesson twice creates one record');
select is((select count(*)::int from public.assignments where assignment_type = 'revision'), 1,
  '15b. and one revision assignment');

update public.memorization_records set performance_rating = 'excellent', change_reason = 'typo'
  where id = 'aaaaaaaa-0000-0000-0000-0000000000d1';
select is((select count(*)::int from public.memorization_record_history
  where memorization_record_id = 'aaaaaaaa-0000-0000-0000-0000000000d1'), 1, 'a correction is written to history');

------------------------------------------------------------------------------
-- 11-13: revocation and anonymous access
------------------------------------------------------------------------------
reset role;
update public.class_enrollments set status = 'ended', end_date = current_date
  where student_id = 'aaaaaaaa-0000-0000-0000-0000000000a1';
select pg_temp.claims('11111111-0000-0000-0000-000000000002');
set local role authenticated;
select is_empty($$ select id from public.students where id = 'aaaaaaaa-0000-0000-0000-0000000000a1' $$,
  '11. teacher loses access after the student leaves their class');

reset role;
select pg_temp.claims('11111111-0000-0000-0000-000000000001');
set local role authenticated;
update public.parent_student_relationships set status = 'revoked'
  where parent_user_id = '11111111-0000-0000-0000-000000000004';
reset role;
select pg_temp.claims('11111111-0000-0000-0000-000000000004');
set local role authenticated;
select is_empty($$ select id from public.students $$, '12. parent loses access after the link is revoked');

reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
select throws_ok($$ select id from public.students $$, '42501', null, '13. anonymous users cannot read students');

reset role;
select * from finish();
rollback;
