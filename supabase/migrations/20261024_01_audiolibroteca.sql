-- Additive migration. Does not change any pre-existing table or auth configuration.
create table public.audiolibroteca_admins (
  user_id uuid primary key references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.audiolibroteca_admins enable row level security;
revoke all on public.audiolibroteca_admins from anon, authenticated;
grant select on public.audiolibroteca_admins to authenticated;
create policy audiolibroteca_own_admin on public.audiolibroteca_admins for select to authenticated using (user_id = (select auth.uid()));

create function public.audiolibroteca_is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.audiolibroteca_admins where user_id = (select auth.uid())) $$;
revoke all on function public.audiolibroteca_is_admin() from public;
grant execute on function public.audiolibroteca_is_admin() to anon, authenticated;

create table public.audiolibroteca_genres (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80)
);
create unique index audiolibroteca_genre_name on public.audiolibroteca_genres (lower(trim(name)));
create table public.audiolibroteca_series (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 150),
  source_url text check (source_url is null or source_url ~ '^https://')
);
create unique index audiolibroteca_series_name on public.audiolibroteca_series (lower(trim(name)));
create table public.audiolibroteca_books (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 300),
  credits text not null check (length(credits) <= 500),
  genre_id uuid not null references public.audiolibroteca_genres(id),
  series_id uuid references public.audiolibroteca_series(id),
  series_order numeric(6,2) check (series_order between 0 and 9999),
  series_label text check (length(series_label) <= 60),
  status text not null default 'Escuchado' check (status in ('Escuchado','Escuchando','Pendiente')),
  platform text not null default '' check (length(platform) <= 100),
  notes text not null default '' check (length(notes) <= 3000),
  needs_review boolean not null default false,
  metadata_sources jsonb not null default '[]'::jsonb check (jsonb_typeof(metadata_sources) = 'array'),
  source_number integer unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (series_id is not null or (series_order is null and series_label is null))
);
create unique index audiolibroteca_book_identity on public.audiolibroteca_books (lower(trim(title)), lower(trim(credits)), lower(trim(platform)));
create index audiolibroteca_books_genre on public.audiolibroteca_books(genre_id);
create index audiolibroteca_books_series on public.audiolibroteca_books(series_id, series_order);
create table public.audiolibroteca_imports (
  book_id uuid primary key references public.audiolibroteca_books(id),
  source_row integer not null unique,
  original_title text not null,
  original_credits text not null,
  review_note text not null default '',
  imported_at timestamptz not null default now()
);
alter table public.audiolibroteca_genres enable row level security;
alter table public.audiolibroteca_series enable row level security;
alter table public.audiolibroteca_books enable row level security;
alter table public.audiolibroteca_imports enable row level security;
revoke all on public.audiolibroteca_genres, public.audiolibroteca_series, public.audiolibroteca_books, public.audiolibroteca_imports from anon, authenticated;
grant select on public.audiolibroteca_genres, public.audiolibroteca_series, public.audiolibroteca_books to anon, authenticated;
grant insert, update on public.audiolibroteca_genres, public.audiolibroteca_series, public.audiolibroteca_books to authenticated;
grant select on public.audiolibroteca_imports to authenticated;
create policy audiolibroteca_genres_read on public.audiolibroteca_genres for select to anon, authenticated using (true);
create policy audiolibroteca_series_read on public.audiolibroteca_series for select to anon, authenticated using (true);
create policy audiolibroteca_books_read on public.audiolibroteca_books for select to anon, authenticated using (true);
create policy audiolibroteca_genres_insert on public.audiolibroteca_genres for insert to authenticated with check ((select public.audiolibroteca_is_admin()));
create policy audiolibroteca_genres_update on public.audiolibroteca_genres for update to authenticated using ((select public.audiolibroteca_is_admin())) with check ((select public.audiolibroteca_is_admin()));
create policy audiolibroteca_series_insert on public.audiolibroteca_series for insert to authenticated with check ((select public.audiolibroteca_is_admin()));
create policy audiolibroteca_series_update on public.audiolibroteca_series for update to authenticated using ((select public.audiolibroteca_is_admin())) with check ((select public.audiolibroteca_is_admin()));
create policy audiolibroteca_books_insert on public.audiolibroteca_books for insert to authenticated with check ((select public.audiolibroteca_is_admin()));
create policy audiolibroteca_books_update on public.audiolibroteca_books for update to authenticated using ((select public.audiolibroteca_is_admin())) with check ((select public.audiolibroteca_is_admin()));
create policy audiolibroteca_imports_read on public.audiolibroteca_imports for select to authenticated using ((select public.audiolibroteca_is_admin()));

create function public.audiolibroteca_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end $$;
create trigger audiolibroteca_touch_book before update on public.audiolibroteca_books for each row execute function public.audiolibroteca_touch();
revoke all on function public.audiolibroteca_touch() from public;

-- SECURITY INVOKER: RLS still applies. Creation of type, series and book is atomic.
create function public.audiolibroteca_save_book(
  p_id uuid, p_expected_updated_at timestamptz, p_title text, p_credits text,
  p_genre text, p_series text, p_series_order numeric, p_series_label text,
  p_status text, p_platform text, p_notes text, p_needs_review boolean
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
    insert into public.audiolibroteca_books(title,credits,genre_id,series_id,series_order,series_label,status,platform,notes,needs_review)
    values(trim(p_title),trim(p_credits),v_genre,v_series,p_series_order,p_series_label,p_status,coalesce(trim(p_platform),''),coalesce(trim(p_notes),''),p_needs_review) returning id into v_id;
  else
    update public.audiolibroteca_books set title=trim(p_title),credits=trim(p_credits),genre_id=v_genre,series_id=v_series,
      series_order=p_series_order,series_label=p_series_label,status=p_status,platform=coalesce(trim(p_platform),''),
      notes=coalesce(trim(p_notes),''),needs_review=p_needs_review,
      metadata_sources=case when title is distinct from trim(p_title) or genre_id is distinct from v_genre or series_id is distinct from v_series or series_order is distinct from p_series_order then '[]'::jsonb else metadata_sources end
    where id=p_id and updated_at=p_expected_updated_at returning id into v_id;
    if v_id is null then raise exception 'CONFLICT: record changed'; end if;
  end if;
  return v_id;
end $$;
revoke all on function public.audiolibroteca_save_book(uuid,timestamptz,text,text,text,text,numeric,text,text,text,text,boolean) from public;
grant execute on function public.audiolibroteca_save_book(uuid,timestamptz,text,text,text,text,numeric,text,text,text,text,boolean) to authenticated;

comment on table public.audiolibroteca_books is 'Public audiobook catalogue; no audio files or credentials. Only allowlisted administrators can write.';
comment on table public.audiolibroteca_imports is 'Original Excel values and import review notes. Administrator-only, not public.';
