-- create_organization, create_class and enroll_new_student.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

create function pg_temp.claims(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email, aud, role) values
  ('44444444-0000-0000-0000-000000000001', 'solo@test.local', 'authenticated', 'authenticated'),
  ('44444444-0000-0000-0000-000000000002', 'stranger@test.local', 'authenticated', 'authenticated');

create temp table ids (name text primary key, id uuid not null);
grant all on ids to authenticated;

select pg_temp.claims('44444444-0000-0000-0000-000000000001');
set local role authenticated;

insert into ids values ('org', public.create_organization('Solo Circle', p_also_teacher => true));
select is((select array_agg(role::text order by role) from public.organization_memberships), array['admin', 'teacher'],
  'a solo teacher becomes admin and teacher in one step');

insert into ids values ('class', public.create_class((select id from ids where name = 'org'), '  Hifz A  '));
select is((select name from public.classes), 'Hifz A', 'class is created with a trimmed name');
select is((select count(*)::int from public.class_teachers
  where teacher_user_id = '44444444-0000-0000-0000-000000000001'), 1, 'the solo teacher is assigned to the new class');

insert into ids values ('student', public.enroll_new_student((select id from ids where name = 'class'), 'Ahmad'));
select is((select count(*)::int from public.students), 1, 'student is created');
select is((select count(*)::int from public.class_enrollments where status = 'active'), 1, 'and actively enrolled');
select ok(private.can_teach_student((select id from ids where name = 'student')),
  'the solo teacher can teach the new student');
select is((select count(*)::int from public.audit_logs where action = 'organization.created'), 1,
  'organization creation is audited');

reset role;
select pg_temp.claims('44444444-0000-0000-0000-000000000002');
set local role authenticated;
select throws_ok($$ select public.create_class((select id from ids where name = 'org'), 'Intruder class') $$,
  '42501', null, 'a non-member cannot create a class');
select throws_ok($$ select public.enroll_new_student((select id from ids where name = 'class'), 'Intruder') $$,
  '42501', null, 'a non-member cannot enroll students');

reset role;
select * from finish();
rollback;
