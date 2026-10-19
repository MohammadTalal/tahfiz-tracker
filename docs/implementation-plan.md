# Implementation Plan

Status: Phase 0 draft. Each step ends with type checks, lint and tests passing, plus a short review.

## Phase 1 — Foundation

1. `git init`, `.gitignore`, push to a private GitHub repo.
2. Create the Next.js app: the latest stable version, TypeScript strict, App Router, `src/`, Tailwind. Pin versions and commit the lockfile.
3. Add shadcn/ui, Lucide, React Hook Form, Zod, next-intl (Arabic default, RTL `dir` on `<html>`).
4. Add `@supabase/supabase-js` + `@supabase/ssr`, with server and browser clients in `src/lib/supabase/`, and session refresh in the middleware/proxy file (the name depends on the Next.js version).
5. Validate environment variables with Zod at startup. Add `.env.example`.
6. Supabase CLI: `supabase init`, run the local stack.
7. Testing: Vitest + React Testing Library, Playwright, pgTAP (`supabase test db`).
8. GitHub Actions CI: lint, typecheck, unit tests, database tests.

**Done when:** the app runs in Arabic RTL and English, CI is green, and a test user can sign in locally.

## Phase 2 — Database and security

1. Migrations 0001–0007 from `database.md` (enums, Quran data, tenancy, classes, records, invitations, RLS).
2. Load Quran metadata (114 surahs, 6,236 ayahs with page/juz/hizb).
3. pgTAP tests 1–15 from `security.md`.
4. Seed fixtures: org A and org B with users for every role.

**Done when:** every security test passes. Stop here if any fail.

## Phase 3 — Pilot slice (vertical)

Build in this order, each one end to end (UI → action → RPC → RLS → test):

1. Sign up / log in / reset password.
2. Create organization + "I am also a teacher".
3. Create class.
4. Add student (name only) to the class.
5. **Surah + ayah picker** (the main picker: search the surah by Arabic or English name, ayah range defaults to the full surah). Page/juz picker after.
6. **Record lesson** screen: passage, rating, optional mistakes, parent feedback, private note, next memorization + revision. Phone-first. Local draft + idempotency key. Target: under 30 seconds.
7. Student history page (lessons + assignments, memorization and revision shown separately).
8. Parent invitation: create link → copy / WhatsApp share / QR → accept → verified link.
9. Parent dashboard: children, recent lessons, next assignments, feedback.
10. Teacher invitation (for orgs with more than one teacher).
11. Playwright e2e: workflows A–D from PRD §24.4.

**Done when:** one real teacher can run a class on it for 2 weeks.

## Phase 4 — Pilot with a real teacher

Measure: time to record a lesson, parent activation rate, errors, and what the teacher still does on paper. Fix the top issues before adding features.

## After the pilot (Release 1)

Attendance, reports, in-app notifications, email, English polish, CSV export, student accounts. Order to be decided from pilot feedback.

## Open decisions

| #   | Question                                           | Default if no answer                                           |
| --- | -------------------------------------------------- | -------------------------------------------------------------- |
| Q1  | Domain name / product name                         | Use a working title                                            |
| Q2  | Which teacher will pilot it, and when              | – (needed for Phase 4)                                         |
| Q3  | Mistake categories list                            | The PRD §10.3 list                                             |
| Q4  | Invite expiry                                      | 7 days                                                         |
| Q5  | Data retention when a parent deletes their account | Keep the student's educational records, remove the parent link |

## Your setup checklist

- [ ] GitHub account + empty private repo
- [ ] Supabase account (two projects later: staging, production)
- [ ] Vercel account linked to GitHub
- [ ] Docker Desktop (for the local Supabase stack)
