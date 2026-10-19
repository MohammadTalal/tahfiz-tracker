-- Profiles, organizations and organization-scoped memberships.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 100),
  preferred_language text not null default 'ar' check (preferred_language in ('ar', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

-- Create a profile for every new auth user.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, preferred_language)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 100),
    case when new.raw_user_meta_data ->> 'preferred_language' = 'en' then 'en' else 'ar' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 150),
  slug text unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  organization_type text not null default 'mosque'
    check (organization_type in ('mosque', 'school', 'program', 'center', 'independent', 'other')),
  description text check (char_length(description) <= 1000),
  logo_url text,
  preferred_language text not null default 'ar' check (preferred_language in ('ar', 'en')),
  timezone text not null default 'America/Toronto',
  riwayah text not null default 'hafs' check (riwayah in ('hafs')),
  contact_email text,
  contact_phone text,
  status public.organization_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_updated_at before update on public.organizations
  for each row execute function private.set_updated_at();

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.membership_role not null,
  status public.membership_status not null default 'active',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id, role)
);

create index organization_memberships_user_idx on public.organization_memberships (user_id)
  where status = 'active';

create trigger organization_memberships_updated_at before update on public.organization_memberships
  for each row execute function private.set_updated_at();
