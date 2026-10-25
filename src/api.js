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
export const COVER_BUCKET = 'audiolibroteca-portadas';
export function coverURL(path) {
  if (!path || !/^[0-9a-f-]{36}\.(webp|jpg)$/.test(path)) return '';
  return supabase.storage.from(COVER_BUCKET).getPublicUrl(path).data.publicUrl;
}
// Resize in the browser to a light WebP (max 900 px tall) before uploading.
export async function prepareCover(file) {
  if (!file.type.startsWith('image/')) throw new Error('COVER_TYPE');
  if (file.size > 15 * 1024 * 1024) throw new Error('COVER_SIZE');
  const bitmap = await decodeImage(file);
  const scale = Math.min(1, 900 / bitmap.height, 600 / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const encode = (type, quality) => new Promise(resolve => canvas.toBlob(resolve, type, quality));
  // Safari (iPhone/iPad) cannot encode WebP and silently returns PNG: fall back to JPEG.
  let blob = await encode('image/webp', 0.84);
  if (!blob || blob.type !== 'image/webp') {
    for (const quality of [0.86, 0.76, 0.66]) {
      blob = await encode('image/jpeg', quality);
      if (blob && blob.type === 'image/jpeg' && blob.size <= 1048576) break;
    }
  }
  if (!blob || !['image/webp', 'image/jpeg'].includes(blob.type)) throw new Error('COVER_TYPE');
  if (blob.size > 1048576) throw new Error('COVER_SIZE');
  return blob;
}
async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file); } catch { /* fall back to <img> */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async'; img.src = url;
    await img.decode();
    return img;
  } catch { throw new Error('COVER_TYPE'); }
  finally { setTimeout(() => URL.revokeObjectURL(url), 0); }
}
export async function uploadCover(blob) {
  const type = blob.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
  const path = `${crypto.randomUUID()}.${type === 'image/jpeg' ? 'jpg' : 'webp'}`;
  const {error} = await supabase.storage.from(COVER_BUCKET).upload(path, blob, {contentType:type, cacheControl:'31536000', upsert:false});
  if (error) throw error;
  return path;
}
export async function removeCover(path) {
  if (path) await supabase.storage.from(COVER_BUCKET).remove([path]).catch(() => {});
}
export async function saveBook(input, existing) {
  const {data,error} = await supabase.rpc('audiolibroteca_save_book_v2', {
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
    p_needs_review: input.needs_review,
    p_summary: (input.summary || '').trim(),
    p_review: (input.review || '').trim(),
    p_rating: input.rating ? Number(input.rating) : null,
    p_cover_path: input.cover_path || null
  });
  if(error) throw error;
  return data;
}
export function humanError(error) {
  if (error?.message === 'COVER_TYPE') return 'No se ha podido leer la imagen. Prueba con una foto JPG, PNG, WebP o HEIC.';
  if (error?.message === 'COVER_SIZE') return 'La imagen es demasiado grande. Prueba con otra de menos de 15 MB.';
  if (error?.code === '23505') return 'Ya existe un audiolibro con ese título, créditos y plataforma. Revisa el registro existente.';
  if (error?.message?.includes('CONFLICT')) return 'Este audiolibro ha cambiado desde que lo abriste. Cierra la ficha, actualiza la página y revisa los cambios antes de guardar.';
  if (error?.code === '42501' || error?.message?.includes('ADMIN_REQUIRED')) return 'No tienes permiso para guardar. Vuelve a iniciar sesión con la cuenta de administrador.';
  if (error?.code === '23514' || error?.code === '22023') return 'Revisa los campos: hay un valor no válido o demasiado largo.';
  return 'No se ha podido completar la operación. Comprueba la conexión y vuelve a intentarlo. No cierres el formulario si quieres conservar lo escrito.';
}
