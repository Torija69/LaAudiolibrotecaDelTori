import test from 'node:test';
import assert from 'node:assert/strict';
import {fold,escapeHTML,safeURL,selectBooks,orderedSeries,validateBook,starsLabel,visibleInfographics,galleryItems} from '../src/domain.js';
const books=[
  {id:'a',title:'El día',credits:'Álvaro',genre_id:'g1',genre:{name:'Fantasía'},series_id:'s1',series:{name:'Serie Á'},series_order:2,source_number:1,created_at:'2026-01-01',status:'Escuchado',needs_review:false},
  {id:'b',title:'Otra',credits:'Beatriz',genre_id:'g2',genre:{name:'Sin clasificar'},series_id:null,series_order:null,source_number:2,created_at:'2026-01-02',status:'Pendiente',needs_review:true},
  {id:'c',title:'Precuela',credits:'Alvaro',genre_id:'g1',genre:{name:'Fantasía'},series_id:'s1',series:{name:'Serie Á'},series_order:0,source_number:3,created_at:'2026-01-03',status:'Escuchado',needs_review:false}
];
test('normaliza tildes y mayúsculas',()=>assert.equal(fold('ÁRBOL'),'arbol'));
test('escapa HTML de todos los campos',()=>assert.equal(escapeHTML('<img src=x onerror="x">'), '&lt;img src=x onerror=&quot;x&quot;&gt;'));
test('rechaza esquemas peligrosos',()=>{assert.equal(safeURL('javascript:alert(1)'),'');assert.equal(safeURL('http://example.com'),'');assert.equal(safeURL('https://example.com'),'https://example.com/');});
test('busca sin tildes por títulos, créditos y serie',()=>{
  assert.equal(selectBooks(books,{q:'dia'}).length,1);
  assert.equal(selectBooks(books,{q:'alvaro'}).length,2);
  assert.equal(selectBooks(books,{q:'serie a'}).length,2);
});
test('combina género, serie y estado',()=>assert.equal(selectBooks(books,{genre:'g1',series:'s1',status:'Escuchado'}).length,2));
test('separa sin serie de independientes',()=>assert.deepEqual(selectBooks(books,{series:'none'}).map(b=>b.id),['b']));
test('filtra revisión y sin clasificar',()=>{assert.equal(selectBooks(books,{review:'review'}).length,1);assert.equal(selectBooks(books,{review:'unclassified'}).length,1);});
test('ordena por posición numérica y precuela cero',()=>assert.deepEqual(orderedSeries([books[0],books[2]]).map(b=>b.id),['c','a']));
test('mantiene orden Excel por defecto',()=>assert.deepEqual(selectBooks([...books].reverse(),{}).map(b=>b.id),['a','b','c']));
test('ordena recientes y título',()=>{assert.equal(selectBooks(books,{sort:'recent'})[0].id,'c');assert.equal(selectBooks(books,{sort:'title'})[0].id,'a');});
test('valida título, créditos, número y estado',()=>{
  const good={title:'Libro',credits:'Autor',genre:'Fantasía',series:'Serie',order:'0',status:'Escuchado'};
  assert.equal(validateBook(good),'');
  for(const bad of [{title:''},{credits:''},{genre:''},{order:'-1'},{order:'NaN'},{series:''},{status:'Inventado'}]) assert.notEqual(validateBook({...good,...bad}),'');
});
test('ordena por valoración y deja los no valorados al final',()=>{
  const rated=[{...books[0],rating:3},{...books[1],rating:null},{...books[2],rating:5}];
  assert.deepEqual(selectBooks(rated,{sort:'rating'}).map(b=>b.id),['c','a','b']);
});
test('valida resumen, reseña y estrellas',()=>{
  const good={title:'Libro',credits:'Autor',genre:'Fantasía',series:'',order:'',status:'Escuchado',summary:'Sinopsis',review:'Me gustó',rating:'5'};
  assert.equal(validateBook(good),'');
  assert.equal(validateBook({...good,rating:''}),'');
  for(const bad of [{rating:'6'},{rating:'0.5'},{summary:'x'.repeat(5001)},{review:'x'.repeat(5001)}]) assert.notEqual(validateBook({...good,...bad}),'');
  assert.equal(starsLabel(4),'4 de 5 estrellas');assert.equal(starsLabel(null),'Sin valorar');
});

test('filtra sin valorar y valorados',()=>{const r=[{id:'a',rating:4,title:'A',credits:'',created_at:''},{id:'b',rating:null,title:'B',credits:'',created_at:''},{id:'c',title:'C',credits:'',created_at:''}];assert.deepEqual(selectBooks(r,{rating:'unrated'}).map(b=>b.id).sort(),['b','c']);assert.deepEqual(selectBooks(r,{rating:'rated'}).map(b=>b.id),['a']);assert.equal(selectBooks(r,{}).length,3);});
test('orden por defecto: título sin tener en cuenta paréntesis',()=>{const r=[{id:'z',title:'Zeta',credits:'',created_at:''},{id:'b',title:'(BlackWater I) La riada',credits:'',created_at:''},{id:'a',title:'Amagi',credits:'',created_at:''}];assert.deepEqual(selectBooks(r,{}).map(b=>b.id),['a','b','z']);});

test('v1.4.0 filtra por infografía',()=>{
  const withInf=[{...books[0],infografias:[{id:'i1',orden:10,elegida:false}]},{...books[1],infografias:[]},books[2]];
  assert.deepEqual(selectBooks(withInf,{infographic:'with'}).map(b=>b.id),['a']);
  assert.deepEqual(selectBooks(withInf,{infographic:'without'}).map(b=>b.id),['b','c']);
});
test('v1.4.0 el público ve la elegida o todas las candidatas en orden',()=>{
  const cand={infografias:[{id:'x',orden:20,elegida:false},{id:'y',orden:10,elegida:false}]};
  assert.deepEqual(visibleInfographics(cand).map(i=>i.id),['y','x']);
  const chosen={infografias:[{id:'x',orden:20,elegida:true},{id:'y',orden:10,elegida:false}]};
  assert.deepEqual(visibleInfographics(chosen).map(i=>i.id),['x']);
  assert.deepEqual(visibleInfographics(chosen,true).map(i=>i.id),['y','x']);
  assert.deepEqual(visibleInfographics({}),[]);
});
test('galería: una tarjeta por infografía visible, en el orden del catálogo',()=>{
  const lib=[
    {...books[0],infografias:[{id:'i2',orden:20,elegida:false},{id:'i1',orden:10,elegida:false}]},
    {...books[1],infografias:[{id:'j1',orden:10,elegida:false},{id:'j2',orden:20,elegida:true}]},
    {...books[2],infografias:[]}
  ];
  assert.deepEqual(galleryItems(lib,{sort:'title'}).map(x=>x.item.id),['i1','i2','j2']);
  assert.deepEqual(galleryItems(lib,{sort:'title'},true).map(x=>x.item.id),['i1','i2','j1','j2']);
  assert.deepEqual(galleryItems(lib,{q:'otra',sort:'title'}).map(x=>x.book.id),['b']);
});
