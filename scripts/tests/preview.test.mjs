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
    // Channels reach shared asset sets through 200 rewrites, as on Pages.
    const { mkdir } = await import('node:fs/promises');
    await mkdir(join(root, 'shared/set/abc'), { recursive: true });
    await writeFile(join(root, 'shared/set/abc/icon.svg'), '<svg/>');
    await writeFile(join(root, '_redirects'), '# comment\n/1.0.0/assets/set/* /shared/set/abc/:splat 200\n');
    const shared = await request('/1.0.0/assets/set/icon.svg');
    assert.equal(shared.status, 200);
    assert.equal(shared.body, '<svg/>');
    assert.match(shared.headers['Content-Type'], /image\/svg\+xml/);
    assert.equal((await request('/1.0.0/assets/set/..%2F..%2F..%2F..%2F..%2Foutside')).status, 400);
    assert.equal((await request('/1.0.0/assets/set/none.svg')).status, 404);
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
