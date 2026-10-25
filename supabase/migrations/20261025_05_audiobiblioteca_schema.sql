-- Explicitly authorized schema relocation, not a data copy/reimport.
-- Requires migrations 01-04. Existing rows, OIDs, grants, RLS, constraints,
-- indexes, triggers and policy dependencies are preserved by SET SCHEMA.
-- The Data API previously exposed only public (verified before deployment).
begin;
set local lock_timeout = '5s';

create schema "Audiobiblioteca";
revoke all on schema "Audiobiblioteca" from public;
grant usage on schema "Audiobiblioteca" to anon, authenticated, service_role;

-- Lock only this application's tables, never other applications' data.
lock table public.audiolibroteca_admins, public.audiolibroteca_books,
  public.audiolibroteca_genres, public.audiolibroteca_imports,
  public.audiolibroteca_series in access exclusive mode;

-- An in-transaction fingerprint prevents a partial or data-changing migration.
create temporary table audiolibroteca_schema_before (
  table_name text primary key, table_oid oid, row_count bigint,
  fingerprint text, policies jsonb, table_acl aclitem[]
) on commit drop;

do $$
declare t text;
begin
  foreach t in array array['audiolibroteca_admins','audiolibroteca_books',
    'audiolibroteca_genres','audiolibroteca_imports','audiolibroteca_series']
  loop
    execute format(
      'insert into audiolibroteca_schema_before
       select %L, %L::regclass::oid, count(*),
         md5(coalesce(string_agg(to_jsonb(r)::text, E''\n'' order by to_jsonb(r)::text), '''')),
         (select jsonb_agg(to_jsonb(p) order by polname)
          from pg_policy p where polrelid = %L::regclass),
         (select relacl from pg_class where oid = %L::regclass)
       from public.%I r', t, 'public.' || t, 'public.' || t, 'public.' || t, t);
  end loop;
end $$;

alter table public.audiolibroteca_admins set schema "Audiobiblioteca";
alter table public.audiolibroteca_books set schema "Audiobiblioteca";
alter table public.audiolibroteca_genres set schema "Audiobiblioteca";
alter table public.audiolibroteca_imports set schema "Audiobiblioteca";
alter table public.audiolibroteca_series set schema "Audiobiblioteca";

-- Move each existing function identity so trigger/RLS/Storage dependencies
-- keep pointing to the same OID. Rewrite SQL bodies as well as the namespace.
do $$
declare f record;
begin
  for f in
    select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args,
      pg_get_functiondef(p.oid) as definition
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'audiolibroteca_touch','audiolibroteca_is_admin',
      'audiolibroteca_save_book','audiolibroteca_save_book_v2')
  loop
    execute format('alter function public.%I(%s) set schema "Audiobiblioteca"',
      f.proname, f.args);
    execute replace(f.definition, 'public.audiolibroteca_',
      '"Audiobiblioteca".audiolibroteca_');
    if not exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where p.oid = f.oid and n.nspname = 'Audiobiblioteca'
    ) then raise exception 'Function identity changed: %', f.proname;
    end if;
  end loop;
end $$;

do $$
declare b record; actual_count bigint; actual_hash text;
begin
  for b in select * from audiolibroteca_schema_before loop
    execute format(
      'select count(*), md5(coalesce(string_agg(to_jsonb(r)::text, E''\n''
       order by to_jsonb(r)::text), '''')) from "Audiobiblioteca".%I r',
      b.table_name) into actual_count, actual_hash;
    if actual_count <> b.row_count or actual_hash <> b.fingerprint
      or to_regclass(format('"Audiobiblioteca".%I', b.table_name))::oid <> b.table_oid
      or not (select relrowsecurity from pg_class where oid = b.table_oid)
      or (select relacl from pg_class where oid = b.table_oid) is distinct from b.table_acl
      or (select jsonb_agg(to_jsonb(p) order by polname)
          from pg_policy p where polrelid = b.table_oid) is distinct from b.policies
    then raise exception 'Integrity check failed: %', b.table_name;
    end if;
  end loop;
end $$;

-- Preserve public for Dieta. Do not grant broad table/function privileges:
-- the original least-privilege ACLs and RLS have moved with their objects.
alter role authenticator set pgrst.db_schemas = 'public, Audiobiblioteca';
notify pgrst, 'reload config';
notify pgrst, 'reload schema';
commit;
