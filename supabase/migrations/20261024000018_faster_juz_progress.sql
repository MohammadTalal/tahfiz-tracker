-- student_juz_progress hit the statement timeout in production: its EXISTS
-- re-read memorization_records (and re-ran its RLS checks) for every ayah of
-- the juz. Same results, but each student's lessons are read once, and page
-- sizes are counted only for the pages of the juzs involved.

create or replace function public.student_juz_progress(p_student_ids uuid[])
returns table (student_id uuid, juz smallint, percent smallint)
language sql
stable
security invoker
set search_path = ''
as $$
  with lessons as materialized (
    select r.student_id, r.start_surah, r.start_ayah, r.end_surah, r.end_ayah,
           r.end_surah as last_surah, r.end_ayah as last_ayah, r.lesson_date, r.created_at
    from public.memorization_records r
    where r.student_id = any (p_student_ids)
      and r.status = 'active'
      and r.performance_rating <> 'not_completed'
  ),
  open_assignments as materialized (
    select distinct on (x.student_id) x.student_id, x.start_surah, x.start_ayah
    from public.assignments x
    where x.student_id = any (p_student_ids)
      and x.assignment_type = 'memorization'
      and x.status in ('assigned', 'in_progress', 'student_reported', 'needs_practice')
    order by x.student_id, x.created_at desc
  ),
  last_lessons as (
    select distinct on (l.student_id) l.student_id, l.last_surah, l.last_ayah
    from lessons l
    order by l.student_id, l.lesson_date desc, l.created_at desc
  ),
  -- Current juz: where the open assignment starts, else where the last lesson ends.
  current_juz as (
    select s.id as student_id, coalesce(qa1.juz_number, qa2.juz_number) as juz
    from unnest(p_student_ids) as s(id)
    left join open_assignments oa on oa.student_id = s.id
    left join public.quran_ayahs qa1 on qa1.surah_number = oa.start_surah and qa1.ayah_number = oa.start_ayah
    left join last_lessons ll on ll.student_id = s.id
    left join public.quran_ayahs qa2 on qa2.surah_number = ll.last_surah and qa2.ayah_number = ll.last_ayah
  ),
  juz_ayahs as (
    select c.student_id, c.juz, a.surah_number, a.ayah_number, a.page_number
    from current_juz c
    join public.quran_ayahs a on a.juz_number = c.juz
  ),
  page_sizes as (
    select a.page_number, count(*) as ayahs
    from public.quran_ayahs a
    where a.page_number in (select distinct j.page_number from juz_ayahs j)
    group by a.page_number
  )
  select j.student_id, j.juz,
    round(100 * coalesce(sum(1.0 / p.ayahs) filter (where exists (
      select 1 from lessons l
      where l.student_id = j.student_id
        and (j.surah_number, j.ayah_number) >= (l.start_surah, l.start_ayah)
        and (j.surah_number, j.ayah_number) <= (l.end_surah, l.end_ayah)
    )), 0) / sum(1.0 / p.ayahs))::smallint as percent
  from juz_ayahs j
  join page_sizes p on p.page_number = j.page_number
  group by j.student_id, j.juz;
$$;
