/**
 * Builds dist/ for Cloudflare Pages. No dependencies — Node's standard library.
 *
 * Output:
 *   dist/fonts/<name>.<hash>.woff2   content-hashed, cached immutable for a year,
 *                                    shared by every version below
 *   dist/v1/…                        FLOATING channel: the newest 1.x. Sites that
 *                                    should pick up approved changes automatically
 *                                    link here. Cached one hour.
 *   dist/1.2.3/…                     EXACT version, cached immutable. Never
 *                                    republish an exact version with different
 *                                    bytes — bump the version instead.
 *   dist/index.html                  the styleguide (also a live smoke test: it
 *                                    consumes /v1/ like any other site would)
 *   dist/404.html                    served by Pages for any missing path
 *   dist/ribbon-shader-studio.html   the Ribbon Shader Studio, presets injected from
 *                                    src/ribbon/presets.json (also published as
 *                                    <channel>/ribbon-presets.json for the sites)
 *   dist/manifest.json               versions and the hashed font map
 *   dist/_headers                    cache + CORS rules for Pages
 *
 * Each version folder contains:
 *   fonts.css     @font-face only (URLs rewritten to ../fonts/<hashed>)
 *   fonts-ja.css  Noto Sans JP, linked in addition by pages with Japanese
 *   tokens.css    primitives + semantic
 *   base.css      element defaults, focus ring, type classes
 *   exaforce.css  fonts + tokens + base in one request
 *   theme.js
 *   assets/       logo, icons, favicon
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const major = 'v' + version.split('.')[0];
const dist = join(root, 'dist');

const read = (p) => readFileSync(join(root, p), 'utf8');
const write = (dir, name, body) => writeFileSync(join(dir, name), body);
/* The source files are documented at length on purpose; the served files
   don't need it. Drops block comments and blank runs, keeps declarations
   and selectors exactly as written (no minifier, nothing to get wrong). */
const lean = (css) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\{\n\n/g, '{\n')
    .trim() + '\n';
const banner = (what) =>
  `/*! Exaforce Design System ${version} — ${what}. Built by scripts/build.mjs from src/; edit the source, not this file. */\n`;

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

/* 1. Fonts: hash the bytes into the filename so the files can be immutable. */
const fontSrc = join(root, 'src/fonts/files');
const fontOut = join(dist, 'fonts');
mkdirSync(fontOut);
const fontMap = {};
for (const file of readdirSync(fontSrc).filter((f) => f.endsWith('.woff2')).sort()) {
  const buf = readFileSync(join(fontSrc, file));
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 8);
  const hashed = file.replace(/\.woff2$/, `.${hash}.woff2`);
  writeFileSync(join(fontOut, hashed), buf);
  fontMap[file] = hashed;
}
cpSync(join(root, 'src/fonts/LICENSE-inter-tight.txt'), join(fontOut, 'LICENSE-inter-tight.txt'));
cpSync(join(root, 'src/fonts/LICENSE-google-sans-flex.txt'), join(fontOut, 'LICENSE-google-sans-flex.txt'));
cpSync(join(root, 'src/fonts/LICENSE-noto-sans-jp.txt'), join(fontOut, 'LICENSE-noto-sans-jp.txt'));

const rewriteFontUrls = (css, label) =>
  css.replace(/url\(\s*['"]?\.\/files\/([^'")]+)['"]?\s*\)/g, (_, file) => {
    if (!fontMap[file]) throw new Error(`${label} references a file that is not in src/fonts/files: ${file}`);
    return `url('../fonts/${fontMap[file]}')`;
  });
const fontsCss = rewriteFontUrls(lean(read('src/fonts/fonts.css')), 'fonts.css');
/* Japanese is opt-in per page — see the note at the top of fonts-ja.css. It is
   deliberately NOT folded into exaforce.css. */
const fontsJaCss = rewriteFontUrls(lean(read('src/fonts/fonts-ja.css')), 'fonts-ja.css');

/* 2. CSS layers. */
const primitives = lean(read('src/tokens/primitives.css'));
const semantic = lean(read('src/tokens/semantic.css'));
const base = lean(read('src/base.css'));
const themeJs = read('src/theme.js');

const ribbonPresets = JSON.parse(read('src/ribbon/presets.json'));
const files = {
  'ribbon-presets.json': JSON.stringify(ribbonPresets, null, 2) + '\n',
  'fonts.css': banner('fonts') + fontsCss,
  'fonts-ja.css': banner('fonts-ja (Noto Sans JP, opt-in per page)') + fontsJaCss,
  'tokens.css': banner('tokens (primitives + semantic)') + primitives + '\n' + semantic,
  'base.css': banner('base') + base,
  'exaforce.css': banner('exaforce.css (fonts + tokens + base)') + fontsCss + '\n' + primitives + '\n' + semantic + '\n' + base,
  'theme.js': themeJs.replace(/^\/\*!/, `/*! v${version}`),
};

for (const channel of [major, version]) {
  const dir = join(dist, channel);
  mkdirSync(dir, { recursive: true });
  for (const [name, body] of Object.entries(files)) write(dir, name, body);
  cpSync(join(root, 'src/assets'), join(dir, 'assets'), { recursive: true });
}

/* 3. Styleguide. The icon inventory is injected so the page never goes stale. */
const iconRoot = join(root, 'src/assets/icons');
const icons = {};
for (const group of readdirSync(iconRoot).sort()) {
  icons[group] = readdirSync(join(iconRoot, group))
    .filter((f) => f.endsWith('.svg'))
    .sort()
    .map((f) => f.replace(/\.svg$/, ''));
}
/* Third-party logo sets: customers ship as <slug>-black/-white/-color, investors
   as one currentColor file each, review marks as -color/-white. */
const logoRoot = join(root, 'src/assets/logos');
const logos = {};
for (const group of readdirSync(logoRoot).sort()) {
  const bySlug = {};
  for (const f of readdirSync(join(logoRoot, group)).filter((f) => f.endsWith('.svg')).sort()) {
    const m = /^(.*?)(?:-(black|white|color))?\.svg$/.exec(f);
    (bySlug[m[1]] ||= []).push(m[2] || 'current');
  }
  logos[group] = bySlug;
}
const html = read('src/site/index.html')
  .replaceAll('__VERSION__', version)
  .replaceAll('__MAJOR__', major)
  .replace('__ICONS_JSON__', JSON.stringify(icons))
  .replace('__LOGOS_JSON__', JSON.stringify(logos));
write(dist, 'index.html', html);

/* 404: Cloudflare Pages serves a root 404.html for any path it cannot find.
   It links everything root-absolute since it renders at arbitrary depths, and
   it knows which channels exist so it can say so. */
write(
  dist,
  '404.html',
  read('src/site/404.html')
    .replaceAll('__VERSION__', version)
    .replaceAll('__MAJOR__', major)
    .replace('__CHANNELS_JSON__', JSON.stringify([major, version])),
);

/* Ribbon Shader Studio: same page, presets injected so it can never disagree
   with the published JSON. */
write(
  dist,
  'ribbon-shader-studio.html',
  read('src/site/ribbon-shader-studio.html')
    .replaceAll('__VERSION__', version)
    .replaceAll('__MAJOR__', major)
    .replace('__RIBBON_PRESETS__', JSON.stringify(ribbonPresets)),
);

/* 4. Manifest + headers. */
write(
  dist,
  'manifest.json',
  JSON.stringify(
    {
      name: pkg.name,
      version,
      channels: { [major]: `/${major}/`, [version]: `/${version}/` },
      files: Object.keys(files).concat(['assets/']),
      fonts: fontMap,
      builtAt: new Date().toISOString(),
    },
    null,
    2,
  ) + '\n',
);

write(
  dist,
  '_headers',
  `# Generated by scripts/build.mjs — Cloudflare Pages headers.
# Every file here is meant to be loaded cross-origin by other Exaforce sites,
# hence the open CORS. Fonts in particular are refused by browsers without it.

/*
  X-Content-Type-Options: nosniff
  Access-Control-Allow-Origin: *
  Timing-Allow-Origin: *
  X-Robots-Tag: noindex

# Content-hashed: the bytes can never change under this name.
/fonts/*
  Cache-Control: public, max-age=31536000, immutable

# Exact version: never republished with different bytes (bump instead).
/${version}/*
  Cache-Control: public, max-age=31536000, immutable

# Floating major: picks up each release within an hour, serves stale while it
# refreshes so no visitor waits on the revalidation.
/${major}/*
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400

/index.html
  Cache-Control: public, max-age=300
/404.html
  Cache-Control: public, max-age=300
/ribbon-shader-studio.html
  Cache-Control: public, max-age=300
/manifest.json
  Cache-Control: public, max-age=300
`,
);

/* 5. Report. */
const size = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(1)} KB`;
console.log(`Exaforce Design System ${version} → dist/`);
console.log(`  channels: /${major}/  /${version}/`);
for (const [name, body] of Object.entries(files)) console.log(`  ${name.padEnd(20)} ${size(body)}`);
console.log(`  fonts: ${Object.keys(fontMap).length} files, hashed`);
console.log(`  icons: ${Object.values(icons).reduce((n, a) => n + a.length, 0)} across ${Object.keys(icons).length} groups`);
console.log(`  logos: ${Object.entries(logos).map(([g, s]) => `${g} ${Object.keys(s).length}`).join(', ')}`);
