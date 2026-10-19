-- Quran reference data is complete and consistent.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

select is((select count(*)::int from public.quran_surahs), 114, '114 surahs');
select is((select count(*)::int from public.quran_ayahs), 6236, '6,236 ayahs');
select is((select sum(ayah_count)::int from public.quran_surahs), 6236, 'surah ayah counts add up to 6,236');
select is_empty($$
  select s.surah_number from public.quran_surahs s
  join public.quran_ayahs a using (surah_number)
  group by s.surah_number, s.ayah_count
  having count(*) <> s.ayah_count or max(a.ayah_number) <> s.ayah_count
$$, 'every surah has exactly ayah_count ayahs numbered 1..n');
select is((select max(page_number)::int from public.quran_ayahs), 604, 'Madani Mushaf has 604 pages');
select is((select page_number::int from public.quran_ayahs where surah_number = 67 and ayah_number = 1), 562,
  'Al-Mulk starts on page 562');
select is((select juz_number::int from public.quran_ayahs where surah_number = 78 and ayah_number = 1), 30,
  'An-Naba starts juz 30');

select * from finish();
rollback;
