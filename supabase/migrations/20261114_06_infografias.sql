-- v1.4.0: galería de infografías por libro. Aditiva: no toca tablas existentes,
-- tablas de Dieta ni otros buckets. Requiere las migraciones 01-05.
begin;

create table "Audiobiblioteca".audiolibroteca_infografias (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references "Audiobiblioteca".audiolibroteca_books(id) on delete cascade,
  path text not null unique
    check (path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$'),
  origen text not null default 'Subida manual' check (length(trim(origen)) between 1 and 60),
  elegida boolean not null default false,
  orden integer not null default 0 check (orden between 0 and 9999),
  created_at timestamptz not null default now()
);
create index audiolibroteca_infografias_book on "Audiobiblioteca".audiolibroteca_infografias (book_id, orden);
-- Como mucho una infografía elegida por libro.
create unique index audiolibroteca_infografias_una_elegida
  on "Audiobiblioteca".audiolibroteca_infografias (book_id) where elegida;

alter table "Audiobiblioteca".audiolibroteca_infografias enable row level security;
revoke all on "Audiobiblioteca".audiolibroteca_infografias from public, anon, authenticated;
grant select on "Audiobiblioteca".audiolibroteca_infografias to anon, authenticated;
grant insert, update, delete on "Audiobiblioteca".audiolibroteca_infografias to authenticated;

-- Lectura pública (forma parte del catálogo); escritura solo de administradores.
create policy audiolibroteca_infografias_select on "Audiobiblioteca".audiolibroteca_infografias
  for select to anon, authenticated using (true);
create policy audiolibroteca_infografias_insert on "Audiobiblioteca".audiolibroteca_infografias
  for insert to authenticated with check ((select "Audiobiblioteca".audiolibroteca_is_admin()));
create policy audiolibroteca_infografias_update on "Audiobiblioteca".audiolibroteca_infografias
  for update to authenticated using ((select "Audiobiblioteca".audiolibroteca_is_admin()))
  with check ((select "Audiobiblioteca".audiolibroteca_is_admin()));
create policy audiolibroteca_infografias_delete on "Audiobiblioteca".audiolibroteca_infografias
  for delete to authenticated using ((select "Audiobiblioteca".audiolibroteca_is_admin()));

-- Bucket público de lectura; 3 MB por imagen; WebP o JPEG (iOS).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audiolibroteca-infografias', 'audiolibroteca-infografias', true, 3145728,
  array['image/webp','image/jpeg'])
on conflict (id) do nothing;

create policy audiolibroteca_infografias_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'audiolibroteca-infografias' and (select "Audiobiblioteca".audiolibroteca_is_admin()));
create policy audiolibroteca_infografias_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'audiolibroteca-infografias' and (select "Audiobiblioteca".audiolibroteca_is_admin()));
create policy audiolibroteca_infografias_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'audiolibroteca-infografias' and (select "Audiobiblioteca".audiolibroteca_is_admin()));

commit;
