// Usage: node scripts/prepare-import.mjs /private/original.json /private/enrichment.json /private/import.sql
// Input/output stay outside the repository. Does not connect to Supabase or contain credentials.
import fs from 'node:fs';
const [originalPath,enrichmentPath,outputPath] = process.argv.slice(2);
if(!originalPath || !enrichmentPath || !outputPath) throw new Error('Expected original.json, enrichment.json, output.sql paths');
const original=JSON.parse(fs.readFileSync(originalPath,'utf8'));
const enrichment=JSON.parse(fs.readFileSync(enrichmentPath,'utf8'));
const seen=new Set();
const records=original.map(b=>{
  if(!b.title || !Number.isInteger(b.source_number) || seen.has(b.source_number)) throw new Error('Invalid or duplicated source number');
  seen.add(b.source_number);
  const m=enrichment.books[String(b.source_number)] || {};
  const group=m.series?enrichment.series[m.series]:null;
  const notes=[];
  if(b.credits.includes('...')) notes.push('Los créditos están truncados en el Excel; no se han completado por suposición.');
  if(m.review_note) notes.push(m.review_note);
  if(!(m.genre || group?.genre)) notes.push('Tipo pendiente de clasificación.');
  return {
    ...b,
    original_title:b.title,
    original_credits:b.credits,
    title:b.title.trim(),
    credits:b.credits.trim(),
    genre:m.genre || group?.genre || 'Sin clasificar',
    series:m.series||null,
    series_order:m.order??null,
    series_label:m.label||null,
    needs_review:notes.length>0,
    review_note:notes.join(' '),
    metadata_sources:[...(group?.sources || []),...(m.sources || [])]
  };
});
const quote=v=>"'"+JSON.stringify(v).replaceAll("'","''")+"'::jsonb";
const groups=Object.entries(enrichment.series).map(([name,value])=>({name,source_url:value.sources[0]?.url||null}));
const sql=`begin;
insert into "Audiobiblioteca".audiolibroteca_genres(name) select distinct v.genre from jsonb_to_recordset(${quote(records)}) as v(genre text) on conflict do nothing;
insert into "Audiobiblioteca".audiolibroteca_series(name,source_url) select name,source_url from jsonb_to_recordset(${quote(groups)}) as v(name text,source_url text) on conflict do nothing;
insert into "Audiobiblioteca".audiolibroteca_books(title,credits,genre_id,series_id,series_order,series_label,status,needs_review,source_number,metadata_sources)
select v.title,v.credits,g.id,s.id,v.series_order,v.series_label,'Escuchado',v.needs_review,v.source_number,v.metadata_sources
from jsonb_to_recordset(${quote(records)}) as v(title text,credits text,genre text,series text,series_order numeric,series_label text,needs_review boolean,source_number integer,metadata_sources jsonb)
join "Audiobiblioteca".audiolibroteca_genres g on lower(g.name)=lower(v.genre)
left join "Audiobiblioteca".audiolibroteca_series s on lower(s.name)=lower(v.series)
on conflict (source_number) do nothing;
insert into "Audiobiblioteca".audiolibroteca_imports(book_id,source_row,original_title,original_credits,review_note)
select b.id,v.source_row,v.original_title,v.original_credits,v.review_note
from jsonb_to_recordset(${quote(records)}) as v(source_number integer,source_row integer,original_title text,original_credits text,review_note text)
join "Audiobiblioteca".audiolibroteca_books b on b.source_number=v.source_number on conflict do nothing;
commit;
select count(*) as books,count(*) filter(where series_id is not null) as series_books from "Audiobiblioteca".audiolibroteca_books;
`;
fs.writeFileSync(outputPath,sql);
console.log(JSON.stringify({records:records.length,series:groups.length,classified:records.filter(r=>r.genre!=='Sin clasificar').length,needs_review:records.filter(r=>r.needs_review).length,output:outputPath},null,2));
