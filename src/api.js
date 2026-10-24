import {createClient} from '@supabase/supabase-js';
// This publishable key is designed for browsers. RLS is the authorization boundary.
export const supabase = createClient(
  'https://ymkojmxilsitilfpmfxc.supabase.co',
  'sb_publishable_L7C8CWIcKhlDjUkLuT6yJg__RVvJ18w',
  {auth: {persistSession: false, autoRefreshToken: true, detectSessionInUrl: false}}
);
async function allRows(table, select, order) {
  const rows = [];
  for (let from = 0; ; from += 500) {
    const {data,error} = await supabase.from(table).select(select).order(order).range(from,from+499);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}
export async function loadCatalogue() {
  const books = await allRows('audiolibroteca_books','*','id');
  const genres = await allRows('audiolibroteca_genres','id,name','name');
  const series = await allRows('audiolibroteca_series','id,name,source_url','name');
  return {books: books.map(b => ({...b, genre: genres.find(g=>g.id===b.genre_id),series:series.find(s=>s.id===b.series_id)})), genres, series};
}
export async function isAdmin() {
  const {data,error} = await supabase.rpc('audiolibroteca_is_admin');
  if(error) throw error;
  return data === true;
}
export async function saveBook(input, existing) {
  const {data,error} = await supabase.rpc('audiolibroteca_save_book', {
    p_id: existing?.id || null,
    p_expected_updated_at: existing?.updated_at || null,
    p_title: input.title.trim(),
    p_credits: input.credits.trim(),
    p_genre: input.genre.trim(),
    p_series: input.series.trim() || null,
    p_series_order: input.series && input.order !== '' ? Number(input.order) : null,
    p_series_label: input.series ? input.series_label.trim() || null : null,
    p_status: input.status,
    p_platform: input.platform.trim(),
    p_notes: input.notes.trim(),
    p_needs_review: input.needs_review
  });
  if(error) throw error;
  return data;
}
export function humanError(error) {
  if (error?.code === '23505') return 'Ya existe un audiolibro con ese título, créditos y plataforma. Revisa el registro existente.';
  if (error?.message?.includes('CONFLICT')) return 'Este audiolibro ha cambiado desde que lo abriste. Cierra la ficha, actualiza la página y revisa los cambios antes de guardar.';
  if (error?.code === '42501' || error?.message?.includes('ADMIN_REQUIRED')) return 'No tienes permiso para guardar. Vuelve a iniciar sesión con la cuenta de administrador.';
  if (error?.code === '23514' || error?.code === '22023') return 'Revisa los campos: hay un valor no válido o demasiado largo.';
  return 'No se ha podido completar la operación. Comprueba la conexión y vuelve a intentarlo. No cierres el formulario si quieres conservar lo escrito.';
}
