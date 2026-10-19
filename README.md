# Quran Learning Platform

Quran memorization and revision tracking for mosques, teachers and parents. Arabic-first (RTL), English supported.

- Requirements: [`PRD.txt`](PRD.txt)
- Design docs: [`docs/`](docs/) — architecture, database, security, implementation plan

## Stack

Next.js 16 (App Router, `src/proxy.ts`), React 19, strict TypeScript, Tailwind CSS 4, shadcn/ui, next-intl, Zod, React Hook Form, Supabase (Postgres, Auth, RLS). Tests: Vitest, Playwright, pgTAP.

## Setup

Requirements: Node.js 22+, Docker Desktop (for the local database).

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run db:start             # starts local Supabase; prints URL and publishable key
npm run dev                  # http://localhost:3000 → redirects to /ar or /en
```

## Scripts

| Command                                       | Does                                                  |
| --------------------------------------------- | ----------------------------------------------------- |
| `npm run dev`                                 | Dev server                                            |
| `npm run build`                               | Production build                                      |
| `npm run lint` / `typecheck` / `format:check` | Code checks                                           |
| `npm test`                                    | Unit tests (Vitest)                                   |
| `npm run test:e2e`                            | Browser tests (Playwright; builds and starts the app) |
| `npm run db:start` / `db:reset` / `db:test`   | Local Supabase, re-apply migrations, run pgTAP tests  |

## Rules

- All schema changes go in `supabase/migrations/`.
- No secret keys in code or in `NEXT_PUBLIC_*` variables.
- Every data feature needs RLS policies and tests (see `docs/security.md`).
