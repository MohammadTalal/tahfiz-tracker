# Quran metadata

`tanzil-quran-data.txt` is the Tanzil Quran Metadata v1.0 (`quran-data.js`), saved as plain text so it is never executed.

- Source: https://tanzil.net/res/text/metadata/quran-data.js (downloaded 2026-10-19)
- Copyright (C) 2008-2009 Tanzil.info
- License: Creative Commons Attribution 3.0 — attribution to Tanzil must be shown in the app (e.g. About page).
- Riwayah: Hafs ʿan ʿĀsim; page numbers follow the Madani Mushaf (604 pages).

`scripts/generate-quran-migration.mjs` parses this file as text and writes
`supabase/migrations/20261019000002_quran_reference.sql`. Re-run it only if the source changes.
