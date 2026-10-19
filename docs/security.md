# Security and Access Rules

Status: Phase 0 draft — release-blocking. Nothing ships until the tests in §6 pass.

## 1. Principles

- Every request runs as the signed-in user. RLS is the main wall; server checks are the second wall.
- Never trust an `organization_id`, role or `student_id` that comes from the browser.
- No service-role key in the pilot. If one is ever needed, it is used only in server-only code, never with a `NEXT_PUBLIC_` prefix.
- Children's data: collect the minimum (display name only), no public pages, and no ads in logged-in areas.

## 2. Who can see a student

`can_access_student(student_id)` is true when **any** of these is true for `auth.uid()`:

| Who              | Rule                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| Org admin        | Active `admin` membership in the student's organization.                                                            |
| Teacher (class)  | Active `teacher` membership **and** in `class_teachers` for a class where the student has an **active** enrollment. |
| Teacher (direct) | Active `teacher` membership **and** an active `teacher_student_assignments` row.                                    |
| Parent           | A `parent_student_relationships` row with `status = 'verified'`.                                                    |

`can_teach_student(student_id)` is the same without the parent rule (admins included). This is used for writes.

When a student moves class, the old teacher loses access automatically, because their enrollment link is no longer active. History rows are kept.

## 3. RLS helper functions

Placed in a `private` schema (not exposed by the API), `security definer`, `stable`, `search_path = ''`:

- `private.is_org_member(org uuid, roles membership_role[])`
- `private.can_access_student(student uuid)`
- `private.can_teach_student(student uuid)`
- `private.is_parent_of(student uuid)`

Policies call these instead of repeating joins. Use `(select auth.uid())` inside them so Postgres caches the value per query.

## 4. Policy matrix

R = select, W = insert/update. No app user can hard-delete records.

| Table                               | Admin (own org) | Teacher                        | Parent                                         | Anyone else   |
| ----------------------------------- | --------------- | ------------------------------ | ---------------------------------------------- | ------------- |
| `quran_surahs`, `quran_ayahs`       | R               | R                              | R                                              | R (signed in) |
| `organizations`                     | R, W (settings) | R                              | R (name only via view)                         | –             |
| `organization_memberships`          | R, W via RPC    | R own rows                     | –                                              | –             |
| `classes`, `class_teachers`         | R, W            | R where teaching               | –                                              | –             |
| `students`                          | R, W            | R where `can_teach_student`    | R where `is_parent_of`                         | –             |
| `class_enrollments`                 | R, W            | R where teaching               | –                                              | –             |
| `parent_student_relationships`      | R, W (revoke)   | R for own students             | R own rows                                     | –             |
| `memorization_records`              | R, W            | R, W where `can_teach_student` | R where `is_parent_of` and `status = 'active'` | –             |
| `memorization_record_private_notes` | R, W            | R, W where `can_teach_student` | **none**                                       | –             |
| `student_private_notes`             | R, W            | R, W where `can_teach_student` | **none**                                       | –             |
| `memorization_record_history`       | R               | R where `can_teach_student`    | –                                              | –             |
| `assignments`                       | R, W            | R, W where `can_teach_student` | R where `is_parent_of`                         | –             |
| `invitations`                       | R, W via RPC    | R own-created                  | –                                              | –             |
| `audit_logs`                        | R               | –                              | –                                              | –             |

Write rules also check:

- `organization_id` on the new row matches the student/class organization (composite FKs enforce this too).
- `teacher_user_id` / `created_by` = `auth.uid()`; it cannot be set to someone else.
- Memberships and roles change **only** through RPC functions. There is no direct insert policy, so nobody can add themselves to an org or promote themselves.

## 5. Invitations

- Token: 32 bytes from a cryptographically secure source, sent as a URL (`/invite/<token>`). Only the SHA-256 hash is stored.
- Expiry: 7 days by default (configurable). Single use. Revocable.
- The link holds no student name. After sign-in the invite page shows only "Join _Org name_ as parent of _student first name_".
- `accept_invitation` locks the row, re-checks expiry/revoked/accepted, and creates the link in one transaction.
- The issuer can't grant more than they hold: only admins invite teachers; admins or the student's teacher invite parents.
- Rate limits: invite creation and acceptance per user and per IP (via the Supabase Auth limits plus a simple table/edge counter; to be decided in Phase 3).
- Shareable by WhatsApp/QR. Anyone holding the link can accept it, so links are short-lived and teachers can see when one was accepted and revoke it.

## 6. Required security tests (pgTAP + Playwright)

Run with two orgs (A, B), each with admin, teacher, parent and students, plus a teacher in A who is _not_ assigned to a given student.

| #   | Attempt                                              | Expected       |
| --- | ---------------------------------------------------- | -------------- |
| 1   | Teacher A reads org B students                       | 0 rows         |
| 2   | Teacher A inserts a record for a student in B        | Error          |
| 3   | Unassigned teacher A reads a student in A            | 0 rows         |
| 4   | Parent reads a non-linked student (guessed ID)       | 0 rows         |
| 5   | Parent reads `memorization_record_private_notes`     | 0 rows         |
| 6   | Parent updates a memorization record                 | Error          |
| 7   | Teacher inserts a membership making themself admin   | Error          |
| 8   | Accept an expired invitation                         | Error          |
| 9   | Accept a revoked invitation                          | Error          |
| 10  | Accept the same invitation twice                     | Second fails   |
| 11  | Teacher reads a student after leaving the class      | 0 rows         |
| 12  | Parent reads after the relationship is revoked       | 0 rows         |
| 13  | Anonymous user reads any app table                   | 0 rows / error |
| 14  | Record with an ayah out of range or end before start | Error          |
| 15  | Same `idempotency_key` saved twice                   | One row        |

## 7. App-level rules

- Server Actions: re-validate with Zod, get the user from `supabase.auth.getUser()` (not from the session cookie alone), and never accept a role from the client.
- Error messages are generic to users; details go to server logs without tokens or student data.
- Logs and audit metadata never contain passwords, tokens, invitation secrets or notes.
- Security headers: CSP, `frame-ancestors 'none'`, `Referrer-Policy: strict-origin-when-cross-origin` (keeps invite tokens out of referrers).

## 8. Privacy (before real data)

- Privacy policy and terms pages (PRD §20.5). Check Canadian privacy law (PIPEDA and the relevant province) for minors' data.
- Turn on backups, and test one restore, before the pilot uses real students.
- Decide retention: what happens to records when an org or a parent deletes their account.
