-- Only organization admins manage class rosters: adding new or existing
-- students to a class and unlinking them. Teachers keep recording lessons for
-- the students in their classes.
--
-- enroll_new_student, enroll_existing_student, unenroll_student and
-- unassigned_students all check permissions through this function.

create or replace function private.managed_class_org(p_class_id uuid)
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
    and private.is_org_member(c.organization_id, array['admin']::public.membership_role[]);
$$;
