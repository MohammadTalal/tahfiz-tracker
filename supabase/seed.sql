-- LOCAL DEVELOPMENT ONLY. Loaded by `supabase db reset` / `supabase start`.
-- Every user's password is: password123
--
--   admin@demo.local    admin + teacher of "Masjid Al-Noor" (class "Hifz A": Ahmad, Fatima)
--   teacher@demo.local  teacher of class "Hifz B" (Yusuf)
--   parent@demo.local   verified parent of Ahmad
--   other@demo.local    admin of a second organization (for isolation checks)

do $$
declare
  v_users constant jsonb := '[
    {"id":"d0000000-0000-0000-0000-000000000001","email":"admin@demo.local","name":"Imam Khalid"},
    {"id":"d0000000-0000-0000-0000-000000000002","email":"teacher@demo.local","name":"Ustadha Maryam"},
    {"id":"d0000000-0000-0000-0000-000000000003","email":"parent@demo.local","name":"Abu Ahmad"},
    {"id":"d0000000-0000-0000-0000-000000000004","email":"other@demo.local","name":"Other Admin"}
  ]';
  v_user jsonb;
begin
  for v_user in select * from jsonb_array_elements(v_users) loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', (v_user ->> 'id')::uuid, 'authenticated', 'authenticated',
      v_user ->> 'email', extensions.crypt('password123', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('display_name', v_user ->> 'name'),
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), (v_user ->> 'id')::uuid, v_user ->> 'id', 'email',
      jsonb_build_object('sub', v_user ->> 'id', 'email', v_user ->> 'email', 'email_verified', true),
      now(), now(), now()
    );
  end loop;
end;
$$;

insert into public.organizations (id, name, organization_type) values
  ('d1000000-0000-0000-0000-000000000001', 'مسجد النور', 'mosque'),
  ('d1000000-0000-0000-0000-000000000002', 'Other Program', 'program');

insert into public.organization_memberships (organization_id, user_id, role) values
  ('d1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'admin'),
  ('d1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'teacher'),
  ('d1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'teacher'),
  ('d1000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004', 'admin');

insert into public.classes (id, organization_id, name) values
  ('d2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'حلقة أ'),
  ('d2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'حلقة ب');

insert into public.class_teachers (organization_id, class_id, teacher_user_id) values
  ('d1000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),
  ('d1000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002');

insert into public.students (id, organization_id, display_name) values
  ('d3000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'أحمد'),
  ('d3000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'فاطمة'),
  ('d3000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'يوسف');

insert into public.class_enrollments (organization_id, class_id, student_id) values
  ('d1000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001'),
  ('d1000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000002'),
  ('d1000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000002', 'd3000000-0000-0000-0000-000000000003');

insert into public.parent_student_relationships (organization_id, parent_user_id, student_id, relationship_type, status)
values ('d1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003',
        'd3000000-0000-0000-0000-000000000001', 'father', 'verified');

insert into public.memorization_records (organization_id, student_id, teacher_user_id, lesson_date,
  start_surah, start_ayah, end_surah, end_ayah, performance_rating, parent_visible_feedback, idempotency_key, created_by)
values
  ('d1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   current_date - 7, 67, 1, 67, 5, 'very_good', 'ما شاء الله، حفظ متقن', gen_random_uuid(), 'd0000000-0000-0000-0000-000000000001'),
  ('d1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   current_date, 67, 6, 67, 10, 'good', 'يحتاج مراجعة الآية 8', gen_random_uuid(), 'd0000000-0000-0000-0000-000000000001');

insert into public.assignments (organization_id, student_id, assigned_by, assignment_type,
  start_surah, start_ayah, end_surah, end_ayah, due_date, idempotency_key)
values
  ('d1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'memorization', 67, 11, 67, 15, current_date + 7, gen_random_uuid()),
  ('d1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'revision', 78, 1, 114, 6, current_date + 7, gen_random_uuid());
