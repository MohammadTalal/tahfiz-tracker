-- How far each student is through the juz they are memorizing now.
--
-- Current juz: where their open memorization assignment starts, else where
-- their last completed lesson ends. Progress: the share of that juz covered
-- by their lessons (not "not completed" ones), each ayah weighted by its
-- share of its Mushaf page so long and short ayahs count fairly. Repeated
-- passages count once. Runs as the caller, so RLS decides visibility (staff
-- for their students, parents for their children).

create function public.student_juz_progress(p_student_ids uuid[])
returns table (student_id uuid, juz smallint, percent smallint)
language sql
stable
security invoker
set search_path = ''
as $$
  with current_juz as (
    select s.id as student_id,
      coalesce(
        (select qa.juz_number
         from public.assignments x
         join public.quran_ayahs qa on qa.surah_number = x.start_surah and qa.ayah_number = x.start_ayah
         where x.student_id = s.id
           and x.assignment_type = 'memorization'
           and x.status in ('assigned', 'in_progress', 'student_reported', 'needs_practice')
         order by x.created_at desc
         limit 1),
        (select qa.juz_number
         from public.memorization_records r
         join public.quran_ayahs qa on qa.surah_number = r.end_surah and qa.ayah_number = r.end_ayah
         where r.student_id = s.id and r.status = 'active' and r.performance_rating <> 'not_completed'
         order by r.lesson_date desc, r.created_at desc
         limit 1)
      ) as juz
    from unnest(p_student_ids) as s(id)
  ),
  weighted as (
    select surah_number, ayah_number, juz_number,
           1.0 / count(*) over (partition by page_number) as weight
    from public.quran_ayahs
  )
  select c.student_id, c.juz,
    round(100 * coalesce(sum(w.weight) filter (where exists (
      select 1 from public.memorization_records r
      where r.student_id = c.student_id
        and r.status = 'active'
        and r.performance_rating <> 'not_completed'
        and (w.surah_number, w.ayah_number) >= (r.start_surah, r.start_ayah)
        and (w.surah_number, w.ayah_number) <= (r.end_surah, r.end_ayah)
    )), 0) / sum(w.weight))::smallint as percent
  from current_juz c
  join weighted w on w.juz_number = c.juz
  group by c.student_id, c.juz;
$$;

revoke execute on function public.student_juz_progress(uuid[]) from public, anon;
grant execute on function public.student_juz_progress(uuid[]) to authenticated;
