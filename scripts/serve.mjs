/**
 * Local preview of dist/ that behaves like Cloudflare Pages where it matters:
 * static files, directory index.html, and a real 404 status that renders
 * dist/404.html for any path that does not exist. No dependencies.
 *
 *   npm run serve            → http://localhost:3000
 *   PORT=8080 npm run serve
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(fileURLToPath(new URL('..', import.meta.url)), 'dist');
const port = Number(process.env.PORT) || 3000;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

async function file(p) {
  try {
    const s = await stat(p);
    if (s.isDirectory()) return file(join(p, 'index.html'));
    return { body: await readFile(p), type: types[extname(p)] || 'application/octet-stream' };
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const safe = normalize(path).replace(/^(\.\.[/\\])+/, '');
  let hit = await file(join(dist, safe));
  let status = 200;
  if (!hit) {
    status = 404;
    hit = (await file(join(dist, '404.html'))) || { body: 'Not found', type: 'text/plain' };
  }
  res.writeHead(status, {
    'Content-Type': hit.type,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  });
  res.end(hit.body);
}).listen(port, () => console.log(`Exaforce Design System preview → http://localhost:${port}/  (serving dist/, 404s render 404.html)`));
