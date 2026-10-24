import test from 'node:test';
import assert from 'node:assert/strict';
import {fold,escapeHTML,safeURL,selectBooks,orderedSeries,validateBook} from '../src/domain.js';
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
