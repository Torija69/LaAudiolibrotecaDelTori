-- v1.3.1: Safari en iPhone/iPad no codifica WebP desde canvas y entrega PNG.
-- Se admite JPEG como alternativa para que las portadas se puedan subir desde iOS.
alter table public.audiolibroteca_books drop constraint audiolibroteca_books_cover_path_check;
alter table public.audiolibroteca_books add constraint audiolibroteca_books_cover_path_check
  check (cover_path is null or cover_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$');
update storage.buckets set allowed_mime_types = array['image/webp','image/jpeg']
  where id = 'audiolibroteca-portadas';
