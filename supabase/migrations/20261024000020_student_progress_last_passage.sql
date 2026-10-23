-- student_progress also returns the passage of each student's last completed
-- lesson (not "not completed"), shown when there is no open memorization.
-- The result columns change, so the function is recreated.

drop function public.student_progress(uuid[]);

create function public.student_progress(p_student_ids uuid[])
returns table (
  student_id uuid,
  last_lesson_date date,
  last_rating public.performance_rating,
  mem_start_surah smallint,
  mem_start_ayah smallint,
  mem_end_surah smallint,
  mem_end_ayah smallint,
  done_start_surah smallint,
  done_start_ayah smallint,
  done_end_surah smallint,
  done_end_ayah smallint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select s.id, l.lesson_date, l.performance_rating,
         a.start_surah, a.start_ayah, a.end_surah, a.end_ayah,
         d.start_surah, d.start_ayah, d.end_surah, d.end_ayah
  from unnest(p_student_ids) as s(id)
  left join lateral (
    select r.lesson_date, r.performance_rating
    from public.memorization_records r
    where r.student_id = s.id and r.status = 'active'
    order by r.lesson_date desc, r.created_at desc
    limit 1
  ) l on true
  left join lateral (
    select x.start_surah, x.start_ayah, x.end_surah, x.end_ayah
    from public.assignments x
    where x.student_id = s.id
      and x.assignment_type = 'memorization'
      and x.status in ('assigned', 'in_progress', 'student_reported', 'needs_practice')
    order by x.created_at desc
    limit 1
  ) a on true
  left join lateral (
    select r.start_surah, r.start_ayah, r.end_surah, r.end_ayah
    from public.memorization_records r
    where r.student_id = s.id and r.status = 'active' and r.performance_rating <> 'not_completed'
    order by r.lesson_date desc, r.created_at desc
    limit 1
  ) d on true;
$$;

revoke execute on function public.student_progress(uuid[]) from public, anon;
grant execute on function public.student_progress(uuid[]) to authenticated;
