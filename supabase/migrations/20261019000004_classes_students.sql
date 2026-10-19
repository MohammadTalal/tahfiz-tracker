-- Classes, students, enrollments and teacher/parent links.
-- Composite foreign keys on (organization_id, ...) stop a row from pointing at
-- another organization's class or student.

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  description text check (char_length(description) <= 1000),
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);

create index classes_organization_idx on public.classes (organization_id);
create trigger classes_updated_at before update on public.classes
  for each row execute function private.set_updated_at();

create table public.class_teachers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  class_id uuid not null,
  teacher_user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (class_id, teacher_user_id),
  foreign key (organization_id, class_id) references public.classes (organization_id, id) on delete cascade
);

create index class_teachers_teacher_idx on public.class_teachers (teacher_user_id);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  display_name text not null check (char_length(display_name) between 1 and 100),
  status public.record_status not null default 'active',
  enrollment_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);

create index students_organization_idx on public.students (organization_id);
create trigger students_updated_at before update on public.students
  for each row execute function private.set_updated_at();

-- Staff-only notes. Kept out of `students` because RLS is per row, not per column.
create table public.student_private_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  student_id uuid not null,
  author_id uuid not null references public.profiles (id),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, student_id) references public.students (organization_id, id)
);

create index student_private_notes_student_idx on public.student_private_notes (student_id);
create trigger student_private_notes_updated_at before update on public.student_private_notes
  for each row execute function private.set_updated_at();

create table public.class_enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  class_id uuid not null,
  student_id uuid not null,
  start_date date not null default current_date,
  end_date date,
  status public.link_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date),
  foreign key (organization_id, class_id) references public.classes (organization_id, id),
  foreign key (organization_id, student_id) references public.students (organization_id, id)
);

create unique index class_enrollments_one_active_idx on public.class_enrollments (class_id, student_id)
  where status = 'active';
create index class_enrollments_student_idx on public.class_enrollments (student_id) where status = 'active';
create trigger class_enrollments_updated_at before update on public.class_enrollments
  for each row execute function private.set_updated_at();

create table public.teacher_student_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  teacher_user_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null,
  start_date date not null default current_date,
  end_date date,
  status public.link_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date),
  foreign key (organization_id, student_id) references public.students (organization_id, id)
);

create unique index teacher_student_assignments_one_active_idx
  on public.teacher_student_assignments (teacher_user_id, student_id) where status = 'active';
create index teacher_student_assignments_student_idx on public.teacher_student_assignments (student_id);
create trigger teacher_student_assignments_updated_at before update on public.teacher_student_assignments
  for each row execute function private.set_updated_at();

create table public.parent_student_relationships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  parent_user_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null,
  relationship_type text check (relationship_type in ('mother', 'father', 'guardian', 'other')),
  status public.relationship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_user_id, student_id),
  foreign key (organization_id, student_id) references public.students (organization_id, id)
);

create index parent_student_relationships_parent_idx on public.parent_student_relationships (parent_user_id)
  where status = 'verified';
create index parent_student_relationships_student_idx on public.parent_student_relationships (student_id);
create trigger parent_student_relationships_updated_at before update on public.parent_student_relationships
  for each row execute function private.set_updated_at();
