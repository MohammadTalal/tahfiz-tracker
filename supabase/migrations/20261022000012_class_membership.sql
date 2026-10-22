-- Move students in and out of classes: list students without a class, enroll
-- an existing student, and unlink a student from a class. Admins may manage any
-- class; teachers only the classes they teach. SECURITY DEFINER so the table
-- policies stay admin-only; each function checks permissions itself.

-- The class's organization when the caller may manage its roster, else null.
create function private.managed_class_org(p_class_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.organization_id
  from public.classes c
  where c.id = p_class_id
    and c.status = 'active'
    and (
      private.is_org_member(c.organization_id, array['admin']::public.membership_role[])
      or (
        private.is_org_member(c.organization_id, array['teacher']::public.membership_role[])
        and exists (
          select 1 from public.class_teachers ct
          where ct.class_id = c.id and ct.teacher_user_id = (select auth.uid())
        )
      )
    );
$$;

-- Active students of the class's organization who are not in any class.
create function public.unassigned_students(p_class_id uuid)
returns table (id uuid, display_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.managed_class_org(p_class_id);
begin
  if v_org is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  return query
    select s.id, s.display_name
    from public.students s
    where s.organization_id = v_org
      and s.status = 'active'
      and not exists (
        select 1 from public.class_enrollments e
        where e.student_id = s.id and e.status = 'active'
      )
    order by s.display_name;
end;
$$;

create function public.enroll_existing_student(p_class_id uuid, p_student_id uuid)
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

-- Ends the enrollment; the student, their lessons and parents are kept.
create function public.unenroll_student(p_class_id uuid, p_student_id uuid)
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

  update public.class_enrollments
  set status = 'ended', end_date = current_date
  where class_id = p_class_id and student_id = p_student_id and status = 'active';
  if not found then
    raise exception 'not_enrolled' using errcode = '22023';
  end if;

  perform private.audit(v_org, 'student.unenrolled', 'student', p_student_id,
    jsonb_build_object('class_id', p_class_id));
end;
$$;

revoke execute on function private.managed_class_org(uuid) from public, anon;
revoke execute on function
  public.unassigned_students(uuid),
  public.enroll_existing_student(uuid, uuid),
  public.unenroll_student(uuid, uuid)
from public, anon;
grant execute on function
  public.unassigned_students(uuid),
  public.enroll_existing_student(uuid, uuid),
  public.unenroll_student(uuid, uuid)
to authenticated;
