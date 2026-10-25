import test from 'node:test';
import assert from 'node:assert/strict';
import {supabase, loadCatalogue, isAdmin, saveBook, coverURL} from '../src/api.js';

test('todas las tablas y RPC usan el esquema exacto Audiobiblioteca', async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const request = new Request(url, init);
    requests.push(request);
    const rpc = request.url.includes('/rpc/');
    return new Response(JSON.stringify(rpc ? false : []), {
      status: 200, headers: {'Content-Type': 'application/json'}
    });
  };
  try {
    await loadCatalogue();
    await isAdmin();
    await supabase.from('audiolibroteca_imports').select('source_row');
    await saveBook({
      title:'Prueba',credits:'Autor',genre:'Novela',series:'',order:'',
      status:'Pendiente',platform:'',notes:'',needs_review:false
    });
    assert.equal(requests.length, 6);
    for (const request of requests) {
      const header = request.method === 'GET' ? 'Accept-Profile' : 'Content-Profile';
      assert.equal(request.headers.get(header), 'Audiobiblioteca', request.url);
    }
    assert.match(coverURL('00000000-0000-0000-0000-000000000000.jpg'),
      /\/storage\/v1\/object\/public\/audiolibroteca-portadas\//);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
