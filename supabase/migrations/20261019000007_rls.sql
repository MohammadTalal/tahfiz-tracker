-- Row Level Security: helper functions and policies.
-- See docs/security.md for the rules these implement.
--
-- Helpers are SECURITY DEFINER so policies can look at membership and link
-- tables without recursive RLS checks. They only ever answer about the
-- current user (auth.uid()).

create function private.is_org_member(p_organization_id uuid, p_roles public.membership_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and o.status <> 'archived'
      and m.role = any (p_roles)
  );
$$;

-- True when the given user holds an active role in the organization (used to
-- check the target of an admin action, e.g. assigning a teacher to a class).
create function private.user_has_role(p_organization_id uuid, p_user_id uuid, p_role public.membership_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = p_user_id
      and m.role = p_role
      and m.status = 'active'
  );
$$;

-- Teacher of the student: active teacher membership AND (teaches a class the
-- student is actively enrolled in, OR has an active direct assignment).
create function private.is_teacher_of(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.students s
    where s.id = p_student_id
      and private.is_org_member(s.organization_id, array['teacher']::public.membership_role[])
      and (
        exists (
          select 1
          from public.class_enrollments e
          join public.class_teachers ct on ct.class_id = e.class_id
          where e.student_id = s.id
            and e.status = 'active'
            and ct.teacher_user_id = (select auth.uid())
        )
        or exists (
          select 1
          from public.teacher_student_assignments a
          where a.student_id = s.id
            and a.status = 'active'
            and a.teacher_user_id = (select auth.uid())
        )
      )
  );
$$;

-- Staff who may read and write the student's learning records.
create function private.can_teach_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_teacher_of(p_student_id)
    or exists (
      select 1 from public.students s
      where s.id = p_student_id
        and private.is_org_member(s.organization_id, array['admin']::public.membership_role[])
    );
$$;

create function private.is_parent_of(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.parent_student_relationships r
    where r.student_id = p_student_id
      and r.parent_user_id = (select auth.uid())
      and r.status = 'verified'
  );
$$;

create function private.can_access_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_teach_student(p_student_id) or private.is_parent_of(p_student_id);
$$;

-- Profiles visible to the current user: their own, people they share an
-- organization with as staff, parents of students they teach, and the
-- teachers/admins of their own children's organizations.
create function private.can_see_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_profile_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships target
      where target.user_id = p_profile_id
        and target.status = 'active'
        and (
          private.is_org_member(target.organization_id, array['admin', 'teacher']::public.membership_role[])
          or exists (
            select 1 from public.parent_student_relationships r
            where r.organization_id = target.organization_id
              and r.parent_user_id = (select auth.uid())
              and r.status = 'verified'
          )
        )
    )
    or exists (
      select 1 from public.parent_student_relationships r
      where r.parent_user_id = p_profile_id
        and r.status <> 'revoked'
        and private.can_teach_student(r.student_id)
    );
$$;

revoke execute on all functions in schema private from public;
grant execute on function
  private.is_org_member(uuid, public.membership_role[]),
  private.user_has_role(uuid, uuid, public.membership_role),
  private.is_teacher_of(uuid),
  private.can_teach_student(uuid),
  private.is_parent_of(uuid),
  private.can_access_student(uuid),
  private.can_see_profile(uuid)
to authenticated;

-- Enable RLS everywhere.
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.classes enable row level security;
alter table public.class_teachers enable row level security;
alter table public.students enable row level security;
alter table public.student_private_notes enable row level security;
alter table public.class_enrollments enable row level security;
alter table public.teacher_student_assignments enable row level security;
alter table public.parent_student_relationships enable row level security;
alter table public.memorization_records enable row level security;
alter table public.memorization_record_private_notes enable row level security;
alter table public.memorization_record_history enable row level security;
alter table public.assignments enable row level security;
alter table public.invitations enable row level security;
alter table public.audit_logs enable row level security;

-- The anonymous role never touches application data (Quran tables excepted).
revoke all on
  public.profiles, public.organizations, public.organization_memberships, public.classes,
  public.class_teachers, public.students, public.student_private_notes, public.class_enrollments,
  public.teacher_student_assignments, public.parent_student_relationships, public.memorization_records,
  public.memorization_record_private_notes, public.memorization_record_history, public.assignments,
  public.invitations, public.audit_logs
from anon;

-- No app user can hard-delete or truncate history-bearing tables.
revoke delete, truncate on
  public.organizations, public.organization_memberships, public.students, public.memorization_records,
  public.memorization_record_history, public.assignments, public.invitations, public.audit_logs,
  public.parent_student_relationships, public.class_enrollments, public.teacher_student_assignments
from authenticated;

-- Profiles
create policy "Profiles: read visible" on public.profiles
  for select to authenticated using (private.can_see_profile(id));
create policy "Profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Organizations (created only through create_organization)
create policy "Organizations: members and parents read" on public.organizations
  for select to authenticated using (
    private.is_org_member(id, array['admin', 'teacher']::public.membership_role[])
    or exists (
      select 1 from public.parent_student_relationships r
      where r.organization_id = organizations.id
        and r.parent_user_id = (select auth.uid())
        and r.status = 'verified'
    )
  );
create policy "Organizations: admins update" on public.organizations
  for update to authenticated
  using (private.is_org_member(id, array['admin']::public.membership_role[]))
  with check (private.is_org_member(id, array['admin']::public.membership_role[]));

-- Memberships: read only. Changes go through security-definer functions, so
-- nobody can add themselves to an organization or raise their own role.
create policy "Memberships: read own and as admin" on public.organization_memberships
  for select to authenticated using (
    user_id = (select auth.uid())
    or private.is_org_member(organization_id, array['admin']::public.membership_role[])
  );

-- Classes
create policy "Classes: staff read" on public.classes
  for select to authenticated using (
    private.is_org_member(organization_id, array['admin', 'teacher']::public.membership_role[])
  );
create policy "Classes: admins insert" on public.classes
  for insert to authenticated with check (
    private.is_org_member(organization_id, array['admin']::public.membership_role[])
  );
create policy "Classes: admins update" on public.classes
  for update to authenticated
  using (private.is_org_member(organization_id, array['admin']::public.membership_role[]))
  with check (private.is_org_member(organization_id, array['admin']::public.membership_role[]));

-- Class teachers
create policy "Class teachers: staff read" on public.class_teachers
  for select to authenticated using (
    private.is_org_member(organization_id, array['admin', 'teacher']::public.membership_role[])
  );
create policy "Class teachers: admins assign teachers" on public.class_teachers
  for insert to authenticated with check (
    private.is_org_member(organization_id, array['admin']::public.membership_role[])
    and private.user_has_role(organization_id, teacher_user_id, 'teacher')
  );
create policy "Class teachers: admins remove" on public.class_teachers
  for delete to authenticated using (
    private.is_org_member(organization_id, array['admin']::public.membership_role[])
  );

-- Students
create policy "Students: authorized read" on public.students
  for select to authenticated using (private.can_access_student(id));
create policy "Students: admins insert" on public.students
  for insert to authenticated with check (
    private.is_org_member(organization_id, array['admin']::public.membership_role[])
  );
create policy "Students: staff update" on public.students
  for update to authenticated
  using (private.can_teach_student(id))
  with check (private.can_teach_student(id));

-- Student private notes (never visible to parents)
create policy "Student notes: staff read" on public.student_private_notes
  for select to authenticated using (private.can_teach_student(student_id));
create policy "Student notes: staff insert" on public.student_private_notes
  for insert to authenticated with check (
    private.can_teach_student(student_id) and author_id = (select auth.uid())
  );
create policy "Student notes: author updates" on public.student_private_notes
  for update to authenticated
  using (private.can_teach_student(student_id) and author_id = (select auth.uid()))
  with check (private.can_teach_student(student_id) and author_id = (select auth.uid()));

-- Class enrollments
create policy "Enrollments: staff read" on public.class_enrollments
  for select to authenticated using (
    private.is_org_member(organization_id, array['admin']::public.membership_role[])
    or exists (
      select 1 from public.class_teachers ct
      where ct.class_id = class_enrollments.class_id and ct.teacher_user_id = (select auth.uid())
    )
  );
create policy "Enrollments: admins insert" on public.class_enrollments
  for insert to authenticated with check (
    private.is_org_member(organization_id, array['admin']::public.membership_role[])
  );
create policy "Enrollments: admins update" on public.class_enrollments
  for update to authenticated
  using (private.is_org_member(organization_id, array['admin']::public.membership_role[]))
  with check (private.is_org_member(organization_id, array['admin']::public.membership_role[]));

-- Direct teacher-student assignments
create policy "Teacher assignments: admins and the teacher read" on public.teacher_student_assignments
  for select to authenticated using (
    teacher_user_id = (select auth.uid())
    or private.is_org_member(organization_id, array['admin']::public.membership_role[])
  );
create policy "Teacher assignments: admins insert" on public.teacher_student_assignments
  for insert to authenticated with check (
    private.is_org_member(organization_id, array['admin']::public.membership_role[])
    and private.user_has_role(organization_id, teacher_user_id, 'teacher')
  );
create policy "Teacher assignments: admins update" on public.teacher_student_assignments
  for update to authenticated
  using (private.is_org_member(organization_id, array['admin']::public.membership_role[]))
  with check (private.is_org_member(organization_id, array['admin']::public.membership_role[]));

-- Parent links: created only by accept_invitation. Admins may revoke.
create policy "Parent links: parent and staff read" on public.parent_student_relationships
  for select to authenticated using (
    parent_user_id = (select auth.uid()) or private.can_teach_student(student_id)
  );
create policy "Parent links: admins revoke" on public.parent_student_relationships
  for update to authenticated
  using (private.is_org_member(organization_id, array['admin']::public.membership_role[]))
  with check (
    private.is_org_member(organization_id, array['admin']::public.membership_role[])
    and status = 'revoked'
  );

-- Memorization records
create policy "Records: staff read" on public.memorization_records
  for select to authenticated using (private.can_teach_student(student_id));
create policy "Records: parents read active" on public.memorization_records
  for select to authenticated using (status = 'active' and private.is_parent_of(student_id));
create policy "Records: staff insert own" on public.memorization_records
  for insert to authenticated with check (
    private.can_teach_student(student_id)
    and teacher_user_id = (select auth.uid())
    and created_by = (select auth.uid())
  );
create policy "Records: staff update" on public.memorization_records
  for update to authenticated
  using (private.can_teach_student(student_id))
  with check (private.can_teach_student(student_id));

-- Private lesson notes (never visible to parents)
create policy "Record notes: staff read" on public.memorization_record_private_notes
  for select to authenticated using (
    exists (
      select 1 from public.memorization_records r
      where r.id = record_id and private.can_teach_student(r.student_id)
    )
  );
create policy "Record notes: staff insert" on public.memorization_record_private_notes
  for insert to authenticated with check (
    updated_by = (select auth.uid())
    and exists (
      select 1 from public.memorization_records r
      where r.id = record_id and private.can_teach_student(r.student_id)
    )
  );
create policy "Record notes: staff update" on public.memorization_record_private_notes
  for update to authenticated
  using (
    exists (
      select 1 from public.memorization_records r
      where r.id = record_id and private.can_teach_student(r.student_id)
    )
  )
  with check (updated_by = (select auth.uid()));

-- Record history: read-only for staff; written by trigger.
create policy "Record history: staff read" on public.memorization_record_history
  for select to authenticated using (
    exists (
      select 1 from public.memorization_records r
      where r.id = memorization_record_id and private.can_teach_student(r.student_id)
    )
  );

-- Assignments
create policy "Assignments: authorized read" on public.assignments
  for select to authenticated using (private.can_access_student(student_id));
create policy "Assignments: staff insert own" on public.assignments
  for insert to authenticated with check (
    private.can_teach_student(student_id) and assigned_by = (select auth.uid())
  );
create policy "Assignments: staff update" on public.assignments
  for update to authenticated
  using (private.can_teach_student(student_id))
  with check (private.can_teach_student(student_id));

-- Invitations: read only; created and accepted through functions.
create policy "Invitations: creator and admins read" on public.invitations
  for select to authenticated using (
    created_by = (select auth.uid())
    or private.is_org_member(organization_id, array['admin']::public.membership_role[])
  );

-- Audit log: admins read their organization's entries.
create policy "Audit: admins read" on public.audit_logs
  for select to authenticated using (
    private.is_org_member(organization_id, array['admin']::public.membership_role[])
  );
