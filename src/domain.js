export const fold = (value = '') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const escapeHTML = (value = '') => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const safeURL = value => { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };
export function selectBooks(books, filters) {
  const q = fold(filters.q).trim();
  const result = books.filter(b =>
    (!q || fold(`${b.title} ${b.credits} ${b.series?.name || ''}`).includes(q)) &&
    (!filters.genre || b.genre_id === filters.genre) &&
    (!filters.series || (filters.series === 'none' ? !b.series_id : b.series_id === filters.series)) &&
    (!filters.status || b.status === filters.status) &&
    (!filters.rating || (filters.rating === 'unrated' ? !b.rating : !!b.rating)) &&
    (!filters.review || (filters.review === 'review' ? b.needs_review : b.genre?.name === 'Sin clasificar'))
  );
  const collator = new Intl.Collator('es', {sensitivity:'base', numeric:true});
  return result.sort((a,b) => filters.sort === 'title' ? collator.compare(a.title,b.title) :
    filters.sort === 'author' ? collator.compare(a.credits,b.credits) || collator.compare(a.title,b.title) :
    filters.sort === 'rating' ? (b.rating || 0) - (a.rating || 0) || collator.compare(a.title,b.title) :
    filters.sort === 'recent' ? b.created_at.localeCompare(a.created_at) || (b.source_number || 0) - (a.source_number || 0) :
    (a.source_number ?? 1000000) - (b.source_number ?? 1000000) || b.created_at.localeCompare(a.created_at));
}
export function orderedSeries(books) {
  return [...books].sort((a,b) => (a.series_order ?? 999999) - (b.series_order ?? 999999) || a.title.localeCompare(b.title,'es'));
}
export function validateBook(book) {
  if (!book.title?.trim() || book.title.trim().length > 300) return 'El título es obligatorio y debe tener como máximo 300 caracteres.';
  if (!book.credits?.trim() || book.credits.trim().length > 500) return 'Indica el autor o los créditos (máximo 500 caracteres).';
  if (!book.genre?.trim() || book.genre.trim().length > 80) return 'Indica un tipo de hasta 80 caracteres.';
  if (book.series?.length > 150) return 'El nombre de la serie no puede superar 150 caracteres.';
  if (book.order !== '' && (!Number.isFinite(Number(book.order)) || Number(book.order) < 0 || Number(book.order) > 9999)) return 'El número de la serie debe estar entre 0 y 9999.';
  if (!book.series && book.order !== '') return 'Asigna una serie antes de indicar su número.';
  if (!['Escuchado','Escuchando','Pendiente'].includes(book.status)) return 'Selecciona un estado válido.';
  if ((book.notes || '').length > 3000) return 'Las notas pueden tener como máximo 3000 caracteres.';
  if ((book.summary || '').length > 5000) return 'El resumen puede tener como máximo 5000 caracteres.';
  if ((book.review || '').length > 5000) return 'La reseña puede tener como máximo 5000 caracteres.';
  if (book.rating && !['1','2','3','4','5',1,2,3,4,5].includes(book.rating)) return 'La valoración debe estar entre 1 y 5 estrellas.';
  return '';
}
export const starsLabel = rating => rating ? `${rating} de 5 estrellas` : 'Sin valorar';
