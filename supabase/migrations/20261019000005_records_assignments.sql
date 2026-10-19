-- Memorization records, their private notes and history, and assignments.
-- Passages are (start_surah, start_ayah) -> (end_surah, end_ayah), may cross
-- surahs, and are validated by foreign keys to quran_ayahs plus an order check.

create table public.memorization_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  student_id uuid not null,
  teacher_user_id uuid not null references public.profiles (id),
  lesson_date date not null,
  start_surah smallint not null,
  start_ayah smallint not null,
  end_surah smallint not null,
  end_ayah smallint not null,
  performance_rating public.performance_rating not null,
  accuracy_score smallint check (accuracy_score between 0 and 100),
  mistake_categories text[] check (cardinality(mistake_categories) <= 20),
  tajweed_assessment text check (char_length(tajweed_assessment) <= 500),
  parent_visible_feedback text check (char_length(parent_visible_feedback) <= 2000),
  idempotency_key uuid not null,
  status public.lesson_status not null default 'active',
  change_reason text check (char_length(change_reason) <= 500),
  created_by uuid not null references public.profiles (id),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, idempotency_key),
  foreign key (organization_id, student_id) references public.students (organization_id, id),
  foreign key (start_surah, start_ayah) references public.quran_ayahs (surah_number, ayah_number),
  foreign key (end_surah, end_ayah) references public.quran_ayahs (surah_number, ayah_number),
  check ((start_surah, start_ayah) <= (end_surah, end_ayah))
);

create index memorization_records_student_date_idx on public.memorization_records (student_id, lesson_date desc);
create index memorization_records_org_date_idx on public.memorization_records (organization_id, lesson_date desc);
create trigger memorization_records_updated_at before update on public.memorization_records
  for each row execute function private.set_updated_at();

-- Teacher-only note for a lesson. Parents have no policy on this table.
create table public.memorization_record_private_notes (
  record_id uuid primary key,
  organization_id uuid not null,
  body text not null check (char_length(body) between 1 and 5000),
  updated_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, record_id) references public.memorization_records (organization_id, id)
);

create trigger memorization_record_private_notes_updated_at before update on public.memorization_record_private_notes
  for each row execute function private.set_updated_at();

-- Append-only change history, written by trigger.
create table public.memorization_record_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  memorization_record_id uuid not null,
  changed_by uuid references public.profiles (id),
  change_type text not null check (change_type in ('update', 'delete', 'restore')),
  reason text,
  previous_values jsonb not null,
  new_values jsonb not null,
  created_at timestamptz not null default now(),
  foreign key (organization_id, memorization_record_id) references public.memorization_records (organization_id, id)
);

create index memorization_record_history_record_idx on public.memorization_record_history (memorization_record_id);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  student_id uuid not null,
  assigned_by uuid not null references public.profiles (id),
  assignment_type public.assignment_type not null,
  start_surah smallint not null,
  start_ayah smallint not null,
  end_surah smallint not null,
  end_ayah smallint not null,
  assigned_date date not null default current_date,
  due_date date,
  priority smallint check (priority between 1 and 3),
  instructions text check (char_length(instructions) <= 1000),
  status public.assignment_status not null default 'assigned',
  student_reported_completed_at timestamptz,
  teacher_verified_at timestamptz,
  source_record_id uuid,
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, idempotency_key),
  foreign key (organization_id, student_id) references public.students (organization_id, id),
  foreign key (organization_id, source_record_id) references public.memorization_records (organization_id, id),
  foreign key (start_surah, start_ayah) references public.quran_ayahs (surah_number, ayah_number),
  foreign key (end_surah, end_ayah) references public.quran_ayahs (surah_number, ayah_number),
  check ((start_surah, start_ayah) <= (end_surah, end_ayah)),
  check (due_date is null or due_date >= assigned_date),
  check (priority is null or assignment_type = 'revision'),
  check (status <> 'teacher_verified' or teacher_verified_at is not null)
);

create index assignments_student_status_idx on public.assignments (student_id, status);
create index assignments_open_due_idx on public.assignments (organization_id, due_date)
  where status in ('assigned', 'in_progress');
create trigger assignments_updated_at before update on public.assignments
  for each row execute function private.set_updated_at();

-- Who created a record, for whom, and when, never changes.
create function private.protect_record_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.organization_id <> old.organization_id
     or new.student_id <> old.student_id
     or new.teacher_user_id <> old.teacher_user_id
     or new.created_by <> old.created_by
     or new.created_at <> old.created_at
     or new.idempotency_key <> old.idempotency_key then
    raise exception 'record_identity_is_immutable' using errcode = '42501';
  end if;
  new.updated_by := (select auth.uid());
  return new;
end;
$$;

create trigger memorization_records_protect_identity before update on public.memorization_records
  for each row execute function private.protect_record_identity();

create function private.protect_assignment_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.organization_id <> old.organization_id
     or new.student_id <> old.student_id
     or new.assigned_by <> old.assigned_by
     or new.created_at <> old.created_at
     or new.idempotency_key <> old.idempotency_key then
    raise exception 'assignment_identity_is_immutable' using errcode = '42501';
  end if;
  if new.status = 'teacher_verified' and old.status <> 'teacher_verified' then
    new.teacher_verified_at := coalesce(new.teacher_verified_at, now());
  end if;
  return new;
end;
$$;

create trigger assignments_protect_identity before update on public.assignments
  for each row execute function private.protect_assignment_identity();

-- Writes a history row for every change to a lesson record.
create function private.log_record_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.memorization_record_history (
    organization_id, memorization_record_id, changed_by, change_type, reason, previous_values, new_values
  ) values (
    new.organization_id,
    new.id,
    (select auth.uid()),
    case
      when new.status = 'deleted' and old.status <> 'deleted' then 'delete'
      when new.status = 'active' and old.status = 'deleted' then 'restore'
      else 'update'
    end,
    new.change_reason,
    to_jsonb(old) - 'updated_at',
    to_jsonb(new) - 'updated_at'
  );
  return new;
end;
$$;

create trigger memorization_records_log_change after update on public.memorization_records
  for each row execute function private.log_record_change();
