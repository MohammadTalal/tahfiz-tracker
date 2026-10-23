-- Class meeting days, and an organization news feed posted by admins.

-- Days a class meets: 0 = Sunday … 6 = Saturday (JavaScript's getDay()).
-- Admins set them through the existing "Classes: admins update" policy.
alter table public.classes
  add column meeting_days smallint[] not null default '{}'
    check (meeting_days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]);

-- News for everyone in an organization: its staff and the verified parents
-- of its students. Only admins post, edit or delete.
create table public.organization_news (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organization_news_org_created_idx on public.organization_news (organization_id, created_at desc);
create trigger organization_news_updated_at before update on public.organization_news
  for each row execute function private.set_updated_at();

alter table public.organization_news enable row level security;
revoke all on public.organization_news from anon;

create policy "News: members and parents read" on public.organization_news
  for select to authenticated using (
    private.is_org_member(organization_id, array['admin', 'teacher']::public.membership_role[])
    or exists (
      select 1 from public.parent_student_relationships r
      where r.organization_id = organization_news.organization_id
        and r.parent_user_id = (select auth.uid())
        and r.status = 'verified'
    )
  );
create policy "News: admins post" on public.organization_news
  for insert to authenticated with check (
    private.is_org_member(organization_id, array['admin']::public.membership_role[])
    and author_id = (select auth.uid())
  );
create policy "News: admins edit" on public.organization_news
  for update to authenticated
  using (private.is_org_member(organization_id, array['admin']::public.membership_role[]))
  with check (private.is_org_member(organization_id, array['admin']::public.membership_role[]));
create policy "News: admins delete" on public.organization_news
  for delete to authenticated using (
    private.is_org_member(organization_id, array['admin']::public.membership_role[])
  );
