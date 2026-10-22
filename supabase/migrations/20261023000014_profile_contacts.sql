-- Optional phone number per person, kept apart from profiles so it is not
-- visible to everyone who can see a name. Readers: the person themselves,
-- admins of an organization the person is staff in, and staff who teach the
-- person's child (for parents).

create table public.profile_contacts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone text not null check (phone ~ '^\+?[0-9 ()-]{6,24}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profile_contacts_updated_at before update on public.profile_contacts
  for each row execute function private.set_updated_at();

create function private.can_see_contact(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id = (select auth.uid())
    or exists (
      select 1 from public.organization_memberships target
      where target.user_id = p_user_id
        and target.status = 'active'
        and private.is_org_member(target.organization_id, array['admin']::public.membership_role[])
    )
    or exists (
      select 1 from public.parent_student_relationships r
      where r.parent_user_id = p_user_id
        and r.status <> 'revoked'
        and private.can_teach_student(r.student_id)
    );
$$;

revoke execute on function private.can_see_contact(uuid) from public;
grant execute on function private.can_see_contact(uuid) to authenticated;

alter table public.profile_contacts enable row level security;
revoke all on public.profile_contacts from anon;

create policy "Contacts: visible read" on public.profile_contacts
  for select to authenticated using (private.can_see_contact(user_id));
create policy "Contacts: own insert" on public.profile_contacts
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Contacts: own update" on public.profile_contacts
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Contacts: own delete" on public.profile_contacts
  for delete to authenticated using (user_id = (select auth.uid()));
