-- Foundation: private schema, enums, shared trigger functions.

-- Helper functions used by RLS policies live here. This schema is not in the
-- API's exposed schemas, so it cannot be called directly over REST.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.membership_role as enum ('admin', 'teacher');
create type public.membership_status as enum ('active', 'revoked');
create type public.organization_status as enum ('active', 'suspended', 'archived');
create type public.record_status as enum ('active', 'archived');
create type public.link_status as enum ('active', 'ended');
create type public.relationship_status as enum ('pending', 'verified', 'revoked');
create type public.lesson_status as enum ('active', 'deleted');
create type public.assignment_type as enum ('memorization', 'revision');
create type public.assignment_status as enum (
  'assigned', 'in_progress', 'student_reported', 'teacher_verified', 'needs_practice', 'cancelled'
);
create type public.performance_rating as enum (
  'excellent', 'very_good', 'good', 'needs_improvement', 'not_completed'
);
create type public.invitation_type as enum ('teacher', 'parent');

-- Keeps updated_at current on every update.
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
