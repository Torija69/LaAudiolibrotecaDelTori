import './style.css';
import {createIcons, BookOpen, LibraryBig, Library, LockKeyhole, Search, SlidersHorizontal, LayoutGrid, Plus, X, ArrowRight, ArrowUpRight, BookMarked, BookKey, Eye, Check, Pencil, LogOut, RefreshCw, Headphones, ChevronRight, AlertCircle, ImagePlus, Trash2, Star} from 'lucide';
import {supabase,loadCatalogue,isAdmin,saveBook,humanError,coverURL,prepareCover,uploadCover,removeCover} from './api.js';
import {escapeHTML as e,fold,safeURL,selectBooks,orderedSeries,validateBook,starsLabel} from './domain.js';

const $ = s => document.querySelector(s);
const icons = () => createIcons({icons:{BookOpen,LibraryBig,Library,LockKeyhole,Search,SlidersHorizontal,LayoutGrid,Plus,X,ArrowRight,ArrowUpRight,BookMarked,BookKey,Eye,Check,Pencil,LogOut,RefreshCw,Headphones,ChevronRight,AlertCircle,ImagePlus,Trash2,Star},attrs:{'aria-hidden':'true','stroke-width':1.6}});
const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const state = {books:[],genres:[],series:[],admin:false,view:'books',loading:true,filters:{q:'',genre:'',series:'',status:'',rating:'',review:'',sort:'title'}};
let dirty = false;
let saving = false;
let toastTimer;
function toast(message) {
  $('#toast').textContent=message; $('#toast').classList.add('visible');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),5500);
}
function show(dialog) { dialog.showModal(); dialog.scrollTop=0; icons(); }
function close(dialog) {
  if (dialog.id==='edit-dialog' && saving) return;
  if (dialog.id==='edit-dialog' && dirty && !confirm('Hay cambios sin guardar. ¿Quieres descartarlos?')) return;
  dialog.close(); if(dialog.id==='edit-dialog') dirty=false;
}
document.addEventListener('click',event=>{
  const closeButton=event.target.closest('[data-close]');
  if(closeButton) close(closeButton.closest('dialog'));
});
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.addEventListener('cancel',event=>{event.preventDefault();close(dialog);});
  dialog.addEventListener('click',event=>{
    if(event.target===dialog) {
      const r=dialog.getBoundingClientRect();
      if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) close(dialog);
    }
  });
});
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});

function renderControls() {
  $('#collection-total').textContent=state.books.length;
  $('#series-total').textContent=`${new Set(state.books.map(b=>b.series_id).filter(Boolean)).size} series`;
  const available=state.genres.filter(g=>state.books.some(b=>b.genre_id===g.id));
  $('#genre-filters').innerHTML=`<button class="filter-chip ${!state.filters.genre?'selected':''}" data-genre="" aria-pressed="${!state.filters.genre}">Todos los tipos <span>${state.books.length}</span></button>`+available.map(g=>`<button class="filter-chip ${state.filters.genre===g.id?'selected':''}" data-genre="${e(g.id)}" aria-pressed="${state.filters.genre===g.id}">${e(g.name)} <span>${state.books.filter(b=>b.genre_id===g.id).length}</span></button>`).join('');
  $('#series-filter').innerHTML='<option value="">Todas las series y títulos</option><option value="none">Sin serie asignada</option>'+state.series.map(s=>`<option value="${e(s.id)}">${e(s.name)}</option>`).join('');
  $('#series-filter').value=state.filters.series;
  $('#admin-actions').hidden=!state.admin;
  $('#review-filter-label').hidden=!state.admin;
  $('#account').innerHTML=icon(state.admin?'check':'lock-keyhole')+`<span>${state.admin?'Administrador':'Administrar'}</span>`;
  $('#account').setAttribute('aria-label',state.admin?'Administrador: sesión activa':'Administrar');
  icons();
}
function stars(rating, extra='') {
  if(!rating) return '';
  return `<span class="stars ${extra}" role="img" aria-label="${starsLabel(rating)}">${[1,2,3,4,5].map(n=>`<span class="${n<=rating?'on':''}" aria-hidden="true">★</span>`).join('')}</span>`;
}
function cover(book, cls) {
  const url=coverURL(book.cover_path);
  return url?`<img class="${cls}" src="${e(url)}" alt="Portada de ${e(book.title)}" loading="lazy" decoding="async">`:'';
}
function seriesPosition(book) {
  return book.series_label || (book.series_order!=null ? `Libro ${Number(book.series_order)}` : 'Sin orden indicado');
}
function card(book) {
  return `<button class="book-card" data-book="${e(book.id)}" aria-label="Ver ficha: ${e(book.title)}">
    <div class="card-cover-frame">${cover(book,'card-cover')||`<span class="card-cover-empty">${icon('book-open')}</span>`}</div>
    <div class="card-top"><span class="type-label">${e(book.genre?.name || 'Sin clasificar')}</span>${state.admin&&book.needs_review?`<span class="review-dot" title="Datos por revisar">${icon('alert-circle')}</span>`:''}</div>
    <div class="card-body"><h3>${e(book.title)}</h3><p class="credits">${e(book.credits || 'Créditos por completar')}</p></div>
    <div class="card-series">${book.series?`${icon('library')}<span>${e(book.series.name)}<small>${e(seriesPosition(book))}</small></span>`:`${icon('book-marked')}<span>Sin serie asignada</span>`}</div>
    <div class="card-bottom"><span class="status-dot ${book.status==='Escuchado'?'done':''}"></span>${e(book.status)}${stars(book.rating,'small')}<span class="card-arrow">${icon('arrow-up-right')}</span></div>
  </button>`;
}
function render() {
  const books=selectBooks(state.books,state.filters);
  $('#catalogue-heading').textContent=state.view==='books'?'En la estantería':'Historias que continúan';
  $('#result-count').textContent=`${books.length} ${books.length===1?'audiolibro':'audiolibros'}${books.length!==state.books.length?` de ${state.books.length}`:''}${state.view==='series'?' · agrupados por serie':''}`;
  document.querySelectorAll('[data-view]').forEach(btn=>{btn.classList.toggle('active',btn.dataset.view===state.view);btn.setAttribute('aria-pressed',String(btn.dataset.view===state.view));});
  const results=$('#results');
  results.setAttribute('aria-busy','false');
  results.className=state.view==='books'?'book-grid':'series-grid';
  if(!books.length) {
    results.className='empty-state';
    results.innerHTML=`${icon('search')}<h3>No hay historias por aquí… todavía.</h3><p>Prueba otro título o quita algún filtro.</p><button class="button secondary" data-reset>Ver toda la colección</button>`;
  } else if(state.view==='books') results.innerHTML=books.map(card).join('');
  else {
    const groups=state.series.filter(s=>books.some(b=>b.series_id===s.id));
    results.innerHTML=groups.map(s=>{
      const group=orderedSeries(books.filter(b=>b.series_id===s.id));
      const total=state.books.filter(b=>b.series_id===s.id).length;
      return `<article class="series-card"><div class="series-heading"><span class="book-symbol">${icon('library-big')}</span><div><h3>${e(s.name)}</h3><p>${group.length===total?`${total} en esta colección`:`${group.length} de ${total} coinciden con los filtros`}</p></div></div><ol class="series-list">${group.map(b=>`<li><button data-book="${e(b.id)}"><span class="series-number">${b.series_label==='Precuela'?'P':b.series_order!=null?Number(b.series_order):'·'}</span><span><strong>${e(b.title)}</strong><small>${e(b.series_label||b.status)}</small></span>${icon('chevron-right')}</button></li>`).join('')}</ol></article>`;
    }).join('');
    const alone=books.filter(b=>!b.series_id);
    if(alone.length) results.innerHTML+=`<section class="unassigned"><h3>Sin serie asignada <span>${alone.length}</span></h3><p class="muted">No implica que sean títulos independientes: la colección aún puede completarse.</p><div class="book-grid">${alone.map(card).join('')}</div></section>`;
  }
  icons();
}
async function refresh() {
  try {
    Object.assign(state,await loadCatalogue(),{loading:false});
    renderControls();render();
    return true;
  } catch {
    state.loading=false;
    $('#results').className='empty-state';$('#results').setAttribute('aria-busy','false');
    $('#results').innerHTML=`${icon('refresh-cw')}<h3>La estantería no ha podido abrirse.</h3><p>Comprueba la conexión y vuelve a intentarlo. No se muestran datos de muestra.</p><button class="button primary" data-retry>Volver a intentar</button>`;
    $('#result-count').textContent='No se ha podido conectar con la colección';
    icons();return false;
  }
}
function resetFilters() {
  Object.assign(state.filters,{q:'',genre:'',series:'',status:'',rating:'',review:''});
  $('#search').value='';$('#series-filter').value='';$('#status-filter').value='';$('#rating-filter').value='';$('#review-filter').value='';
  renderControls();render();
}
document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>{state.view=btn.dataset.view;render();}));
$('#search').addEventListener('input',event=>{state.filters.q=event.target.value;render();});
$('#sort').addEventListener('change',event=>{state.filters.sort=event.target.value;render();});
$('#genre-filters').addEventListener('click',event=>{const btn=event.target.closest('[data-genre]');if(btn){state.filters.genre=btn.dataset.genre;renderControls();render();}});
$('#series-filter').addEventListener('change',event=>{state.filters.series=event.target.value;render();});
$('#status-filter').addEventListener('change',event=>{state.filters.status=event.target.value;render();});
$('#rating-filter').addEventListener('change',event=>{state.filters.rating=event.target.value;render();});
$('#review-filter').addEventListener('change',event=>{state.filters.review=event.target.value;render();});
$('#reset').addEventListener('click',resetFilters);
$('#toggle-filters').addEventListener('click',()=>{
  const panel=$('#extra-filters');panel.hidden=!panel.hidden;$('#toggle-filters').setAttribute('aria-expanded',String(!panel.hidden));
});
$('#results').addEventListener('click',event=>{
  const book=event.target.closest('[data-book]');
  if(book) openDetail(state.books.find(b=>b.id===book.dataset.book));
  if(event.target.closest('[data-reset]')) resetFilters();
  if(event.target.closest('[data-retry]')) refresh();
});
document.addEventListener('keydown',event=>{
  if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.querySelector('dialog[open]')){event.preventDefault();$('#search').focus();}
});

function openDetail(book) {
  if(!book)return;
  const dialog=$('#detail-dialog');
  const sources=(book.metadata_sources||[]).filter(s=>safeURL(s.url));
  dialog.innerHTML=`<div class="dialog-top"><span class="eyebrow">FICHA DE ESCUCHA</span><button class="icon-button" data-close aria-label="Cerrar">${icon('x')}</button></div><div class="detail-heading ${book.cover_path?'with-cover':''}">${cover(book,'detail-cover')||`<span class="dialog-symbol">${icon('book-open')}</span>`}<span class="type-badge">${e(book.genre?.name||'Sin clasificar')}</span></div><h2 id="detail-heading">${e(book.title)}</h2>${book.rating?`<div class="detail-rating">${stars(book.rating)}<span>${starsLabel(book.rating)}</span></div>`:''}<dl class="detail-data"><div><dt>Autoría y créditos</dt><dd>${e(book.credits||'No indicados')}</dd></div><div><dt>Estado</dt><dd>${e(book.status)}</dd></div><div><dt>Serie</dt><dd>${book.series?`${e(book.series.name)} · ${e(seriesPosition(book))}`:'Sin serie asignada'}</dd></div>${book.platform?`<div><dt>Plataforma</dt><dd>${e(book.platform)}</dd></div>`:''}</dl>${book.summary?`<section class="detail-text"><h3>Resumen</h3><p>${e(book.summary).replace(/\n/g,'<br>')}</p></section>`:''}${book.review?`<section class="detail-text review"><h3>Mi reseña</h3><p>${e(book.review).replace(/\n/g,'<br>')}</p></section>`:''}${book.notes?`<div class="detail-notes"><h3>Notas</h3><p>${e(book.notes).replace(/\n/g,'<br>')}</p></div>`:''}${book.series?`<button class="button secondary" id="explore-series">${icon('library')}Ver esta serie</button>`:''}${sources.length?`<details class="metadata-sources"><summary>Fuentes de clasificación</summary><p>Tipo y orden de serie consultados el 24 de octubre de 2026. Los créditos del Excel se conservan sin reconstruir.</p><ul>${sources.map(s=>`<li><a href="${e(safeURL(s.url))}" target="_blank" rel="noopener noreferrer">${e(s.label)}</a></li>`).join('')}</ul></details>`:''}${state.admin?`<div id="import-info"></div><div class="dialog-actions"><button class="button primary" id="edit-book">${icon('pencil')}Editar audiolibro</button></div>`:''}`;
  show(dialog);
  $('#explore-series')?.addEventListener('click',()=>{
    dialog.close();resetFilters();state.view='series';state.filters.series=book.series_id;renderControls();render();$('#extra-filters').hidden=false;$('#toggle-filters').setAttribute('aria-expanded','true');$('#catalogue').scrollIntoView({behavior:'smooth'});
  });
  $('#edit-book')?.addEventListener('click',()=>{dialog.close();openEditor(book);});
  if(state.admin && book.source_number) {
    const area=$('#import-info');
    supabase.from('audiolibroteca_imports').select('source_row,original_title,original_credits,review_note').eq('book_id',book.id).maybeSingle().then(({data,error})=>{
      if(!state.admin || !area.isConnected)return;
      if(error){area.innerHTML='<p class="muted">No se ha podido recuperar la trazabilidad del Excel.</p>';return;}
      if(data)area.innerHTML=`<details class="import-details" ${book.needs_review?'open':''}><summary>Original del Excel · fila ${data.source_row}</summary><p><strong>Título:</strong> ${e(data.original_title)}</p><p><strong>Créditos:</strong> ${e(data.original_credits)}</p>${data.review_note?`<p class="review-note">${e(data.review_note)}</p>`:''}<p class="fine-print">Este original se conserva aunque edites la ficha. Solo lo ve el administrador.</p></details>`;
    });
  }
}
$('#account').addEventListener('click',()=>{
  if(state.admin){$('#admin-actions').scrollIntoView({behavior:'smooth',block:'center'});toast('Tu sesión de administrador está activa.');return;}
  $('#login-error').textContent='';show($('#login-dialog'));
});
$('#show-password').addEventListener('click',()=>{
  const input=$('#login-form [name=password]');input.type=input.type==='password'?'text':'password';$('#show-password').setAttribute('aria-label',input.type==='password'?'Mostrar contraseña':'Ocultar contraseña');
});
$('#login-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget;const submit=form.querySelector('[type=submit]');
  submit.disabled=true;submit.textContent='Comprobando acceso…';$('#login-error').textContent='';
  try {
    const {error}=await supabase.auth.signInWithPassword({email:form.email.value.trim(),password:form.password.value});
    if(error)throw new Error('LOGIN');
    if(!await isAdmin()){await supabase.auth.signOut({scope:'local'});throw new Error('PERMISSION');}
    state.admin=true;form.reset();form.password.type='password';$('#show-password').setAttribute('aria-label','Mostrar contraseña');
    $('#login-dialog').close();renderControls();render();toast('Sesión iniciada. Ya puedes cuidar la colección.');
  } catch(error) {
    $('#login-error').textContent=error.message==='PERMISSION'?'Esta cuenta no tiene permisos de administrador. Puedes consultar el catálogo sin iniciar sesión.':'No se ha podido iniciar sesión. Revisa el correo y la contraseña o inténtalo de nuevo más tarde.';
  } finally {submit.disabled=false;submit.innerHTML='Entrar a la audiolibroteca'+icon('arrow-right');icons();}
});
$('#logout').addEventListener('click',async()=>{
  await supabase.auth.signOut({scope:'local'});state.admin=false;state.filters.review='';renderControls();render();toast('Sesión cerrada. Sigues en el catálogo público.');
});
supabase.auth.onAuthStateChange(event=>{
  if(event==='SIGNED_OUT'){
    state.admin=false;state.filters.review='';dirty=false;
    for(const selector of ['#detail-dialog','#edit-dialog']){
      $(selector).close();$(selector).replaceChildren();
    }
    renderControls();render();
  }
});
$('#add-book').addEventListener('click',()=>openEditor());
function openEditor(book) {
  if(!state.admin){show($('#login-dialog'));return;}
  const dialog=$('#edit-dialog');dirty=false;
  dialog.innerHTML=`<div class="dialog-top"><span class="eyebrow">ADMINISTRACIÓN</span><button type="button" class="icon-button" data-close aria-label="Cerrar">${icon('x')}</button></div><h2 id="edit-heading">${book?'Editar audiolibro':'Una historia más'}</h2><p class="muted">Los campos con * son obligatorios. Al guardar, la ficha será visible para todos.</p><form id="book-form"><label>Título *<input name="title" required maxlength="300" value="${e(book?.title||'')}" autofocus></label><label>Autoría y créditos *<input name="credits" required maxlength="500" value="${e(book?.credits||'')}"><small>Conserva aquí autores, traducción o narración si quieres incluirlos.</small></label><div class="form-grid"><label>Tipo *<input name="genre" list="genre-options" required maxlength="80" value="${e(book?.genre?.name||'Sin clasificar')}"><datalist id="genre-options">${state.genres.map(g=>`<option value="${e(g.name)}">`).join('')}</datalist><small>Elige uno existente o escribe un tipo nuevo.</small></label><label>Estado<select name="status">${['Escuchado','Escuchando','Pendiente'].map(s=>`<option ${s===(book?.status||'Escuchado')?'selected':''}>${s}</option>`).join('')}</select></label></div><label>Serie<input name="series" list="series-options" maxlength="150" placeholder="Sin serie asignada" value="${e(book?.series?.name||'')}"><datalist id="series-options">${state.series.map(s=>`<option value="${e(s.name)}">`).join('')}</datalist><small>Puedes elegir una serie o crear una nueva escribiendo su nombre.</small></label><div class="form-grid"><label>Número en la serie<input name="order" type="number" min="0" max="9999" step="0.01" value="${book?.series_order!=null?Number(book.series_order):''}" placeholder="1, 2, 3…"></label><label>Etiqueta de orden<input name="series_label" maxlength="60" value="${e(book?.series_label||'')}" placeholder="Ej. Precuela"></label></div><label>Plataforma<input name="platform" maxlength="100" value="${e(book?.platform||'')}" placeholder="Opcional"></label><fieldset class="cover-field"><legend>Portada</legend><div class="cover-editor"><div id="cover-preview" class="cover-preview">${cover(book||{},'')||icon('image-plus')}</div><div class="cover-actions"><label class="button secondary file-button">${icon('image-plus')}<span id="cover-pick-label">${book?.cover_path?'Cambiar imagen':'Elegir imagen'}</span><input id="cover-input" type="file" accept="image/*" class="sr-only"></label><button type="button" class="button quiet" id="cover-remove" ${book?.cover_path?'':'hidden'}>${icon('trash-2')}Quitar portada</button><small>JPG, PNG o WebP. Se reduce automáticamente antes de subirla y será pública.</small></div></div></fieldset><label>Resumen del libro<textarea name="summary" rows="4" maxlength="5000" placeholder="De qué trata la historia…">${e(book?.summary||'')}</textarea></label><label>Mi reseña<textarea name="review" rows="4" maxlength="5000" placeholder="Qué te pareció…">${e(book?.review||'')}</textarea><small>El resumen y la reseña son públicos.</small></label><fieldset class="rating-field"><legend>Valoración</legend><div class="rating-input">${[5,4,3,2,1].map(n=>`<input type="radio" name="rating" id="rating-${n}" value="${n}" ${book?.rating===n?'checked':''}><label for="rating-${n}" title="${starsLabel(n)}"><span class="sr-only">${starsLabel(n)}</span>★</label>`).join('')}</div><label class="checkbox-label"><input type="radio" name="rating" value="" ${book?.rating?'':'checked'}>Sin valorar</label></fieldset><label>Notas públicas<textarea name="notes" rows="3" maxlength="3000" placeholder="Una impresión, una recomendación…">${e(book?.notes||'')}</textarea><small>No incluyas información privada: estas notas son públicas.</small></label><label class="checkbox-label"><input name="needs_review" type="checkbox" ${book?.needs_review?'checked':''}>Marcar los datos para revisar</label><p id="book-error" class="form-error" role="alert"></p><div class="dialog-actions"><button class="button quiet" type="button" data-close>Cancelar</button><button class="button primary" type="submit">${icon('check')}${book?'Guardar cambios':'Añadir a la colección'}</button></div></form>`;
  show(dialog);
  const form=$('#book-form');
  form.addEventListener('input',()=>{dirty=true;});
  let coverBlob=null, coverRemoved=false, previewURL='';
  const preview=$('#cover-preview');
  const setPreview=html=>{if(previewURL)URL.revokeObjectURL(previewURL);previewURL='';preview.innerHTML=html;icons();};
  $('#cover-input').addEventListener('change',async event=>{
    const file=event.target.files[0];event.target.value='';if(!file)return;
    $('#book-error').textContent='';preview.classList.add('busy');
    try{
      coverBlob=await prepareCover(file);coverRemoved=false;dirty=true;
      setPreview('');previewURL=URL.createObjectURL(coverBlob);
      preview.innerHTML=`<img src="${previewURL}" alt="Vista previa de la nueva portada">`;
      $('#cover-remove').hidden=false;$('#cover-pick-label').textContent='Cambiar imagen';
    }catch(error){$('#book-error').textContent=humanError(error);}
    finally{preview.classList.remove('busy');}
  });
  $('#cover-remove').addEventListener('click',()=>{
    coverBlob=null;coverRemoved=true;dirty=true;setPreview(icon('image-plus'));
    $('#cover-remove').hidden=true;$('#cover-pick-label').textContent='Elegir imagen';
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const data=Object.fromEntries(new FormData(form));data.needs_review=form.needs_review.checked;
    const problem=validateBook(data);$('#book-error').textContent=problem;if(problem)return;
    const duplicate=state.books.find(b=>b.id!==book?.id && fold(b.title).trim()===fold(data.title).trim() && fold(b.credits).trim()===fold(data.credits).trim() && fold(b.platform).trim()===fold(data.platform).trim());
    if(duplicate){$('#book-error').textContent='Este título con los mismos créditos y plataforma ya está en la colección.';return;}
    const button=form.querySelector('[type=submit]');button.disabled=true;saving=true;button.textContent=coverBlob?'Subiendo portada…':'Guardando…';
    const previous=book?.cover_path||null;let uploaded=null;
    try{
      if(coverBlob){uploaded=await uploadCover(coverBlob);button.textContent='Guardando…';}
      data.cover_path=uploaded||(coverRemoved?null:previous);
      await saveBook(data,book);
      if(previous&&previous!==data.cover_path)removeCover(previous);
      uploaded=null;if(previewURL)URL.revokeObjectURL(previewURL);
      dirty=false;saving=false;dialog.close();
      const loaded=await refresh();
      toast(loaded?(book?'Cambios guardados en Supabase.':'Audiolibro añadido a la colección.'):'Guardado en Supabase. No se ha podido recargar el catálogo; pulsa «Volver a intentar».');
    }catch(error){if(uploaded)removeCover(uploaded);$('#book-error').textContent=humanError(error);}
    finally{saving=false;button.disabled=false;button.innerHTML=icon('check')+(book?'Guardar cambios':'Añadir a la colección');icons();}
  });
}
icons();
refresh();
