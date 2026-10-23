-- Class meeting days (admins) and organization news (admins post; staff and parents read).
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email, aud, role) values
  ('cccccccc-0000-0000-0000-000000000001', 'nw.admin@test.local', 'authenticated', 'authenticated'),
  ('cccccccc-0000-0000-0000-000000000002', 'nw.teacher@test.local', 'authenticated', 'authenticated'),
  ('cccccccc-0000-0000-0000-000000000003', 'nw.parent@test.local', 'authenticated', 'authenticated'),
  ('cccccccc-0000-0000-0000-000000000004', 'nw.outsider@test.local', 'authenticated', 'authenticated');
insert into public.organizations (id, name) values ('cccccccc-0000-0000-0000-0000000000f1', 'NW Org');
insert into public.organization_memberships (organization_id, user_id, role) values
  ('cccccccc-0000-0000-0000-0000000000f1', 'cccccccc-0000-0000-0000-000000000001', 'admin'),
  ('cccccccc-0000-0000-0000-0000000000f1', 'cccccccc-0000-0000-0000-000000000002', 'teacher');
insert into public.classes (id, organization_id, name) values
  ('cccccccc-0000-0000-0000-0000000000c1', 'cccccccc-0000-0000-0000-0000000000f1', 'A');
insert into public.students (id, organization_id, display_name) values
  ('cccccccc-0000-0000-0000-0000000000a1', 'cccccccc-0000-0000-0000-0000000000f1', 'Kid');
insert into public.parent_student_relationships (organization_id, student_id, parent_user_id, status) values
  ('cccccccc-0000-0000-0000-0000000000f1', 'cccccccc-0000-0000-0000-0000000000a1', 'cccccccc-0000-0000-0000-000000000003', 'verified');

-- Admin: set class days, post news.
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok($$ update public.classes set meeting_days = '{6,1,3}' where id = 'cccccccc-0000-0000-0000-0000000000c1' $$,
  'an admin sets the class days');
select throws_ok($$ update public.classes set meeting_days = '{7}' where id = 'cccccccc-0000-0000-0000-0000000000c1' $$,
  '23514', null, 'days are 0–6 only');
select lives_ok($$ insert into public.organization_news (organization_id, author_id, title, body)
  values ('cccccccc-0000-0000-0000-0000000000f1', 'cccccccc-0000-0000-0000-000000000001', 'Eid holiday', 'No classes next week.') $$,
  'an admin posts news');

-- Teacher: reads news, cannot post or change days.
reset role;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.organization_news), 1, 'teachers read the news');
select throws_ok($$ insert into public.organization_news (organization_id, author_id, title)
  values ('cccccccc-0000-0000-0000-0000000000f1', 'cccccccc-0000-0000-0000-000000000002', 'Mine') $$,
  '42501', null, 'teachers cannot post news');
update public.classes set meeting_days = '{0}' where id = 'cccccccc-0000-0000-0000-0000000000c1';
delete from public.organization_news;
reset role;
select is((select meeting_days from public.classes where id = 'cccccccc-0000-0000-0000-0000000000c1'), '{6,1,3}'::smallint[],
  'teachers cannot change class days');
select is((select count(*)::int from public.organization_news), 1, 'teachers cannot delete news');

-- Parent of a student reads; an outsider does not.
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.organization_news), 1, 'parents read their organization''s news');
reset role;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.organization_news), 0, 'outsiders see no news');

-- Admin deletes.
reset role;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
delete from public.organization_news;
reset role;
select is((select count(*)::int from public.organization_news), 0, 'admins delete news');

select * from finish();
rollback;
