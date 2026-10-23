-- Fixes from the code review.

-- 1. Student rows (name, status) are changed by admins only. Teachers record
--    lessons through record_lesson; they never edit the student itself.
drop policy "Students: staff update" on public.students;
create policy "Students: admins update" on public.students
  for update to authenticated
  using (private.is_org_member(organization_id, array['admin']::public.membership_role[]))
  with check (private.is_org_member(organization_id, array['admin']::public.membership_role[]));

-- 2. Each student's last lesson and current memorization in one round trip,
--    without loading their whole history (and without the API row cap
--    cutting it short). Runs as the caller, so RLS still decides visibility.
create function public.student_progress(p_student_ids uuid[])
returns table (
  student_id uuid,
  last_lesson_date date,
  last_rating public.performance_rating,
  mem_start_surah smallint,
  mem_start_ayah smallint,
  mem_end_surah smallint,
  mem_end_ayah smallint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select s.id, l.lesson_date, l.performance_rating,
         a.start_surah, a.start_ayah, a.end_surah, a.end_ayah
  from unnest(p_student_ids) as s(id)
  left join lateral (
    select r.lesson_date, r.performance_rating
    from public.memorization_records r
    where r.student_id = s.id and r.status = 'active'
    order by r.lesson_date desc, r.created_at desc
    limit 1
  ) l on true
  left join lateral (
    select x.start_surah, x.start_ayah, x.end_surah, x.end_ayah
    from public.assignments x
    where x.student_id = s.id
      and x.assignment_type = 'memorization'
      and x.status in ('assigned', 'in_progress', 'student_reported', 'needs_practice')
    order by x.created_at desc
    limit 1
  ) a on true;
$$;

revoke execute on function public.student_progress(uuid[]) from public, anon;
grant execute on function public.student_progress(uuid[]) to authenticated;

-- 3. Phone numbers need the country code ("+1 604 …") so call and WhatsApp
--    links work. NOT VALID: numbers saved before stay until edited.
alter table public.profile_contacts drop constraint profile_contacts_phone_check;
alter table public.profile_contacts
  add constraint profile_contacts_phone_check check (phone ~ '^\+[0-9][0-9 ()-]{5,23}$') not valid;

-- 4. Two admins adding the same unassigned student at the same moment could
--    put them in two classes. Lock the student row before checking.
create or replace function public.enroll_existing_student(p_class_id uuid, p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.managed_class_org(p_class_id);
begin
  if v_org is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  perform 1 from public.students where id = p_student_id for update;

  if not exists (
    select 1 from public.students s
    where s.id = p_student_id and s.organization_id = v_org and s.status = 'active'
  ) or exists (
    select 1 from public.class_enrollments e
    where e.student_id = p_student_id and e.status = 'active'
  ) then
    raise exception 'not_unassigned' using errcode = '22023';
  end if;

  insert into public.class_enrollments (organization_id, class_id, student_id)
  values (v_org, p_class_id, p_student_id);

  perform private.audit(v_org, 'student.enrolled', 'student', p_student_id,
    jsonb_build_object('class_id', p_class_id));
end;
$$;
