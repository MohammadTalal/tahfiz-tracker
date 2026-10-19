-- Invitations (only a hash of the token is stored) and the audit log.

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  invitation_type public.invitation_type not null,
  intended_role public.membership_role,
  email text check (email is null or email ~ '^[^@\s]+@[^@\s]+$'),
  student_id uuid,
  token_hash bytea not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references public.profiles (id),
  revoked_at timestamptz,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  foreign key (organization_id, student_id) references public.students (organization_id, id),
  check (invitation_type <> 'parent' or (student_id is not null and intended_role is null)),
  check (invitation_type <> 'teacher' or (intended_role = 'teacher' and student_id is null))
);

create index invitations_organization_idx on public.invitations (organization_id);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations (id) on delete set null,
  actor_user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_organization_idx on public.audit_logs (organization_id, created_at desc);

-- Internal helper for writing audit rows from security-definer functions.
create function private.audit(
  p_organization_id uuid, p_action text, p_entity_type text, p_entity_id uuid, p_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (p_organization_id, (select auth.uid()), p_action, p_entity_type, p_entity_id, p_metadata);
$$;

revoke execute on function private.audit(uuid, text, text, uuid, jsonb) from public, authenticated;
