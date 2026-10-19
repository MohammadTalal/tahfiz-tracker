# Architecture

Status: Phase 0 draft — to be reviewed before Phase 1.
Source of truth for requirements: `PRD.txt`.

## 1. Summary

A **modular monolith**: one Next.js app (App Router, strict TypeScript) talking to **Supabase** (PostgreSQL, Auth, RLS). No separate backend service.

```text
Browser (phone / tablet / desktop)
        │  HTTPS
        ▼
Next.js app (Vercel)
  ├─ Server Components  → read data (as the signed-in user, RLS applies)
  ├─ Server Actions     → validate (Zod) → call Postgres RPC functions
  └─ Client Components  → forms, pickers, local drafts only
        │  user's session (publishable key + JWT)
        ▼
Supabase
  ├─ Auth       (email/password, magic links)
  ├─ PostgreSQL (tables + RLS + RPC functions + triggers)
  └─ Storage    (not used in pilot)
```

## 2. Key decisions

| #   | Decision                                                                                                                                                  | Why                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| D1  | All database access runs **as the signed-in user** (RLS applies). The service-role key is not used in the pilot.                                          | Defence in depth: a server bug cannot bypass RLS.                                                              |
| D2  | **Multi-step writes are Postgres functions (RPC)** run in one transaction, e.g. `record_lesson`, `accept_invitation`, `create_organization`.              | Atomic and testable at the database level.                                                                     |
| D3  | Reads go straight to tables/views through RLS.                                                                                                            | Simple, no duplicate auth logic.                                                                               |
| D4  | Private data (teacher-only notes) lives in **separate tables**, not extra columns.                                                                        | RLS works per row, not per column. A parent who can read a record row could otherwise read every column in it. |
| D5  | Roles live on `organization_memberships`, never on the profile. Parents get access through `parent_student_relationships`, not through a membership role. | Matches the multi-org, multi-role rules in PRD §4.3.                                                           |
| D6  | Quran passages are stored as `start_surah, start_ayah, end_surah, end_ayah`, validated by foreign keys to `quran_ayahs`. Surah + ayah is the main picker. | Teachers track by surah. Ranges can still cross surahs.                                                        |
| D7  | Arabic is the default locale, with RTL first. Localization uses `next-intl` with `/[locale]/…` routes.                                                    | PRD §17.2.                                                                                                     |
| D8  | Each lesson/assignment save carries an **idempotency key**. Unsaved forms are kept as a local draft.                                                      | Weak mosque internet (PRD §23.2).                                                                              |
| D9  | Validation uses **shared Zod schemas** on client and server, plus Postgres constraints as the final guard.                                                | One set of rules; the database still protects itself.                                                          |

## 3. Request flow examples

**Teacher records a lesson**

1. Client form (React Hook Form + Zod) → generates `idempotency_key` → saves a draft locally.
2. Server Action re-validates with the same Zod schema.
3. Server Action calls `rpc('record_lesson', …)` as the user.
4. The function checks the teacher can access the student, inserts the record, any private note, and the next assignments in one transaction, then writes history/audit rows.
5. On success the client clears the draft. On a network failure it keeps the draft and retries; a repeat key returns the existing record.

**Parent opens the dashboard**

1. A Server Component queries `students`, `memorization_records` and `assignments`.
2. RLS returns only children linked through a verified, active relationship.
3. Teacher-only notes are in a table parents cannot read at all.

## 4. Source layout

Follows PRD §3.2, trimmed for the pilot:

```text
src/
  app/[locale]/
    (public)/          home, privacy, terms
    (auth)/            login, signup, reset, invite/[token]
    (app)/
      admin/           org settings, teachers, classes
      teacher/         classes, students, record lesson
      parent/          children, progress
  components/ui/       shadcn/ui
  components/quran/    surah/ayah picker, passage display
  features/<area>/     schemas.ts, actions.ts, queries.ts per feature
  lib/supabase/        server + browser clients
  lib/auth/            getUser, requireMembership helpers
  i18n/                messages/ar.json, messages/en.json
supabase/
  migrations/          SQL migrations (source of truth for the schema)
  seed/                Quran metadata + dev fixtures
  tests/               pgTAP RLS tests
tests/                 vitest unit, playwright e2e
```

## 5. Environments

| Env        | App               | Database                              |
| ---------- | ----------------- | ------------------------------------- |
| Local      | `next dev`        | Supabase CLI local stack (Docker)     |
| Staging    | Vercel preview    | Separate Supabase project             |
| Production | Vercel production | Separate Supabase project, backups on |

Secrets live only in environment variables. `.env.example` lists names only.

## 6. Out of scope for the pilot

Email sending, notifications, attendance, student logins, CSV export, platform super-admin UI, full offline mode, other riwayat.
