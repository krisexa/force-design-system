import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { preview } from '../serve.mjs';

test('preview handles invalid URLs and continues serving files and real 404s', async () => {
  const root = await mkdtemp(join(tmpdir(), 'design-preview-test-'));
  try {
    await writeFile(join(root, 'index.html'), 'Home');
    await writeFile(join(root, '404.html'), 'Missing');
    async function request(url) {
      const result = {};
      await preview({ url }, {
        writeHead(status, headers) { Object.assign(result, { status, headers }); },
        end(body) { result.body = String(body); },
      }, root);
      return result;
    }
    for (const url of ['/%', '/%E0%A4%A', '/%00', '/..%2Foutside']) {
      assert.equal((await request(url)).status, 400, url);
    }
    const home = await request('/');
    assert.equal(home.status, 200);
    assert.equal(home.body, 'Home');
    assert.match(home.headers['Content-Type'], /text\/html/);
    assert.equal(home.headers['Cache-Control'], 'no-store');
    const missing = await request('/missing');
    assert.equal(missing.status, 404);
    assert.equal(missing.body, 'Missing');
    // A symlink loop is an I/O failure, not a missing page.
    const { symlink } = await import('node:fs/promises');
    await symlink('loop', join(root, 'loop'));
    assert.equal((await request('/loop')).status, 500);
    assert.equal((await request('/')).status, 200);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
