-- Admins manage their organization's members: make a teacher an admin (or
-- take admin away), and remove a member from the organization entirely.
-- Memberships change only through these SECURITY DEFINER functions; each
-- checks the caller is an admin and keeps at least one admin.

create function private.active_admin_count(p_organization_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.organization_memberships
  where organization_id = p_organization_id and role = 'admin' and status = 'active';
$$;

create function public.set_member_admin(p_organization_id uuid, p_user_id uuid, p_admin boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_org_member(p_organization_id, array['admin']::public.membership_role[]) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.organization_memberships
    where organization_id = p_organization_id and user_id = p_user_id and status = 'active'
  ) then
    raise exception 'not_a_member' using errcode = '22023';
  end if;

  if p_admin then
    insert into public.organization_memberships (organization_id, user_id, role)
    values (p_organization_id, p_user_id, 'admin')
    on conflict (organization_id, user_id, role) do update set status = 'active';
  else
    -- An admin cannot demote themselves, and the organization keeps an admin.
    if p_user_id = (select auth.uid()) then
      raise exception 'cannot_change_self' using errcode = '22023';
    end if;
    update public.organization_memberships set status = 'revoked'
    where organization_id = p_organization_id and user_id = p_user_id and role = 'admin';
    if private.active_admin_count(p_organization_id) = 0 then
      raise exception 'last_admin' using errcode = '22023';
    end if;
  end if;

  perform private.audit(p_organization_id, case when p_admin then 'member.made_admin' else 'member.admin_removed' end,
    'profile', p_user_id, '{}'::jsonb);
end;
$$;

-- Removes a member: all their roles end, they leave every class, and their
-- direct student assignments end. They then see nothing of the organization
-- (every policy requires an active membership). Lessons they recorded stay.
create function public.remove_member(p_organization_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_org_member(p_organization_id, array['admin']::public.membership_role[]) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'cannot_change_self' using errcode = '22023';
  end if;

  update public.organization_memberships set status = 'revoked'
  where organization_id = p_organization_id and user_id = p_user_id and status = 'active';
  if not found then
    raise exception 'not_a_member' using errcode = '22023';
  end if;

  delete from public.class_teachers
  where organization_id = p_organization_id and teacher_user_id = p_user_id;
  update public.teacher_student_assignments set status = 'ended', end_date = current_date
  where organization_id = p_organization_id and teacher_user_id = p_user_id and status = 'active';

  perform private.audit(p_organization_id, 'member.removed', 'profile', p_user_id, '{}'::jsonb);
end;
$$;

revoke execute on function private.active_admin_count(uuid) from public, anon;
revoke execute on function
  public.set_member_admin(uuid, uuid, boolean),
  public.remove_member(uuid, uuid)
from public, anon;
grant execute on function
  public.set_member_admin(uuid, uuid, boolean),
  public.remove_member(uuid, uuid)
to authenticated;
