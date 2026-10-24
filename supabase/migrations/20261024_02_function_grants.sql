-- Supabase default function privileges can include explicit grants, not just PUBLIC.
revoke all on function public.audiolibroteca_touch() from public, anon, authenticated;
revoke all on function public.audiolibroteca_save_book(uuid,timestamptz,text,text,text,text,numeric,text,text,text,text,boolean) from public, anon;
grant execute on function public.audiolibroteca_save_book(uuid,timestamptz,text,text,text,text,numeric,text,text,text,text,boolean) to authenticated;
