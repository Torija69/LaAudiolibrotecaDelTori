-- v1.1.0 · Additive. Cover images, summary, public review and 1-5 star rating.
-- Does not modify Dieta tables, Dieta storage policies or shared auth settings.
alter table public.audiolibroteca_books
  add column summary text not null default '' check (length(summary) <= 5000),
  add column review text not null default '' check (length(review) <= 5000),
  add column rating smallint check (rating between 1 and 5),
  add column cover_path text check (cover_path is null or cover_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$');

-- Public bucket: covers are part of the public catalogue. Only admins can write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audiolibroteca-portadas', 'audiolibroteca-portadas', true, 1048576, array['image/webp'])
on conflict (id) do nothing;

create policy audiolibroteca_portadas_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'audiolibroteca-portadas' and (select public.audiolibroteca_is_admin()));
create policy audiolibroteca_portadas_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'audiolibroteca-portadas' and (select public.audiolibroteca_is_admin()));
create policy audiolibroteca_portadas_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'audiolibroteca-portadas' and (select public.audiolibroteca_is_admin()));

-- New save function. SECURITY INVOKER: RLS and allowlist still apply.
create function public.audiolibroteca_save_book_v2(
  p_id uuid, p_expected_updated_at timestamptz, p_title text, p_credits text,
  p_genre text, p_series text, p_series_order numeric, p_series_label text,
  p_status text, p_platform text, p_notes text, p_needs_review boolean,
  p_summary text, p_review text, p_rating smallint, p_cover_path text
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_genre uuid; v_series uuid; v_id uuid;
begin
  if not public.audiolibroteca_is_admin() then raise exception 'ADMIN_REQUIRED' using errcode = '42501'; end if;
  if length(trim(p_credits)) = 0 then raise exception 'CREDITS_REQUIRED' using errcode = '22023'; end if;
  insert into public.audiolibroteca_genres(name) values(trim(p_genre)) on conflict do nothing;
  select id into strict v_genre from public.audiolibroteca_genres where lower(trim(name)) = lower(trim(p_genre));
  if nullif(trim(p_series),'') is not null then
    insert into public.audiolibroteca_series(name) values(trim(p_series)) on conflict do nothing;
    select id into strict v_series from public.audiolibroteca_series where lower(trim(name)) = lower(trim(p_series));
  end if;
  if p_id is null then
    insert into public.audiolibroteca_books(title,credits,genre_id,series_id,series_order,series_label,status,platform,notes,needs_review,summary,review,rating,cover_path)
    values(trim(p_title),trim(p_credits),v_genre,v_series,p_series_order,p_series_label,p_status,coalesce(trim(p_platform),''),coalesce(trim(p_notes),''),p_needs_review,
      coalesce(trim(p_summary),''),coalesce(trim(p_review),''),p_rating,p_cover_path) returning id into v_id;
  else
    update public.audiolibroteca_books set title=trim(p_title),credits=trim(p_credits),genre_id=v_genre,series_id=v_series,
      series_order=p_series_order,series_label=p_series_label,status=p_status,platform=coalesce(trim(p_platform),''),
      notes=coalesce(trim(p_notes),''),needs_review=p_needs_review,
      summary=coalesce(trim(p_summary),''),review=coalesce(trim(p_review),''),rating=p_rating,cover_path=p_cover_path,
      metadata_sources=case when title is distinct from trim(p_title) or genre_id is distinct from v_genre or series_id is distinct from v_series or series_order is distinct from p_series_order then '[]'::jsonb else metadata_sources end
    where id=p_id and updated_at=p_expected_updated_at returning id into v_id;
    if v_id is null then raise exception 'CONFLICT: record changed'; end if;
  end if;
  return v_id;
end $$;
revoke all on function public.audiolibroteca_save_book_v2(uuid,timestamptz,text,text,text,text,numeric,text,text,text,text,boolean,text,text,smallint,text) from public, anon;
grant execute on function public.audiolibroteca_save_book_v2(uuid,timestamptz,text,text,text,text,numeric,text,text,text,text,boolean,text,text,smallint,text) to authenticated;
