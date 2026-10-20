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
import { join, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(fileURLToPath(new URL('..', import.meta.url)), 'dist');
const port = process.env.PORT === undefined ? 3000 : Number(process.env.PORT);
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
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
    return null;
  }
}

export async function preview(req, res, root = dist) {
  function send(status, body, type = 'text/plain; charset=utf-8') {
    res.writeHead(status, {
      'Content-Type': type,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.includes('\0')) throw new Error('invalid path');
  } catch {
    send(400, 'Bad request');
    return;
  }
  const target = resolve(root, '.' + pathname);
  if (target !== root && !target.startsWith(root + sep)) {
    send(400, 'Bad request');
    return;
  }
  try {
    let hit = await file(target);
    const status = hit ? 200 : 404;
    if (!hit) hit = (await file(join(root, '404.html'))) || { body: 'Not found', type: 'text/plain' };
    send(status, hit.body, hit.type);
  } catch {
    // Avoid dumping request URLs, filesystem paths or error objects.
    console.error('Preview could not read a file.');
    send(500, 'Internal server error');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('PORT must be an integer from 1 to 65535.');
    process.exitCode = 1;
  } else {
    const server = createServer((req, res) => preview(req, res));
    server.on('error', () => {
      console.error('Preview could not listen on 127.0.0.1. Check PORT and local permissions.');
      process.exitCode = 1;
    });
    server.listen(port, '127.0.0.1', () => console.log(`Exaforce Design System preview → http://127.0.0.1:${port}/  (serving dist/, 404s render 404.html)`));
  }
}
