/**
 * Invariants the token layer must hold. Runs before every build; run it on its
 * own with `npm run check`. Exits non-zero on the first category that fails,
 * after printing every violation in it.
 *
 *   1. semantic.css contains no literal colours or sizes — every value is a
 *      var() of a primitive (or a color-mix / calc / gradient of them).
 *   2. Every var(--x) referenced in semantic.css and base.css resolves to a
 *      token defined in primitives.css or semantic.css.
 *   3. The two dark blocks (system-preference and explicit) remap exactly the
 *      same tokens to exactly the same values. Dark is duplicated by hand for a
 *      specificity reason; a token missing from one block keeps its LIGHT value
 *      in that state, which shows up as near-black text on a dark panel.
 *   4. Every token remapped for dark is also declared unconditionally in
 *      :root, so no state can leave a token undefined.
 *   5. fonts.css only references files that exist in src/fonts/files, and
 *      every file there is referenced.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

const primitives = stripComments(read('src/tokens/primitives.css'));
const semantic = stripComments(read('src/tokens/semantic.css'));
const base = stripComments(read('src/base.css'));
const fontsCss = stripComments(read('src/fonts/fonts.css')) + '\n' + stripComments(read('src/fonts/fonts-ja.css'));

let failed = false;
function report(title, problems) {
  if (problems.length === 0) {
    console.log(`ok    ${title}`);
    return;
  }
  failed = true;
  console.log(`FAIL  ${title}`);
  for (const p of problems) console.log(`      ${p}`);
}

/* Declarations: "--name: value;" pairs, in document order. */
const declRe = /(--[a-z][a-z0-9-]*)\s*:\s*([^;]+);/g;
const decls = (css) => Array.from(css.matchAll(declRe), (m) => [m[1], m[2].replace(/\s+/g, ' ').trim()]);

/* 1. No literals in the semantic layer. */
{
  const literal = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab)\(|(?<![\w-])\d*\.?\d+(?:px|rem|em|ms|s|vw|vh)\b/;
  const problems = [];
  for (const [name, value] of decls(semantic)) {
    if (literal.test(value)) problems.push(`${name}: ${value}`);
  }
  report('semantic.css holds no literal colours or sizes', problems);
}

/* 2. Every var() resolves. */
const defined = new Set([...decls(primitives), ...decls(semantic)].map(([n]) => n));
{
  const problems = [];
  for (const [label, css] of [
    ['semantic.css', semantic],
    ['base.css', base],
  ]) {
    for (const m of css.matchAll(/var\(\s*(--[a-z][a-z0-9-]*)/g)) {
      if (!defined.has(m[1])) problems.push(`${label} references undefined ${m[1]}`);
    }
  }
  report(`every var() resolves (${defined.size} tokens defined)`, [...new Set(problems)]);
}

/* Blocks: extract the body between the first "{" after a selector and its match. */
function block(css, selectorRe) {
  const m = selectorRe.exec(css);
  if (!m) return null;
  let i = css.indexOf('{', m.index + m[0].length - 1);
  let depth = 0;
  const start = i + 1;
  for (; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(start, i);
  }
  return null;
}
const lightBlock = block(semantic, /(^|\n)\s*:root\s*\{/);
const darkSystem = block(semantic, /:root:not\(\[data-theme=['"]light['"]\]\)\s*\{/);
const darkExplicit = block(semantic, /(^|\n)\s*:root\[data-theme=['"]dark['"]\]\s*\{/);

/* 3. Dark parity. */
{
  const problems = [];
  if (!lightBlock || !darkSystem || !darkExplicit) {
    problems.push('could not find all three theme blocks (:root, prefers-color-scheme dark, [data-theme=dark])');
  } else {
    const a = new Map(decls(darkSystem));
    const b = new Map(decls(darkExplicit));
    for (const [k, v] of a) {
      if (!b.has(k)) problems.push(`${k} is remapped for system-dark but missing from [data-theme='dark']`);
      else if (b.get(k) !== v) problems.push(`${k} differs: system-dark "${v}" vs explicit-dark "${b.get(k)}"`);
    }
    for (const k of b.keys()) {
      if (!a.has(k)) problems.push(`${k} is remapped for [data-theme='dark'] but missing from system-dark`);
    }
  }
  report('both dark blocks remap the same tokens to the same values', problems);
}

/* 4. Every dark token has a light default. */
{
  const problems = [];
  if (lightBlock && darkSystem) {
    const light = new Set(decls(lightBlock).map(([n]) => n));
    for (const [k] of decls(darkSystem)) {
      if (!light.has(k)) problems.push(`${k} is set in dark but has no unconditional :root value`);
    }
  }
  report('every dark-remapped token has an unconditional light value', problems);
}

/* 5. Font files. */
{
  const problems = [];
  const onDisk = new Set(readdirSync(join(root, 'src/fonts/files')).filter((f) => f.endsWith('.woff2')));
  const referenced = new Set(Array.from(fontsCss.matchAll(/url\(\s*['"]?\.\/files\/([^'")]+)['"]?\s*\)/g), (m) => m[1]));
  for (const f of referenced) if (!onDisk.has(f)) problems.push(`fonts.css references missing file ${f}`);
  for (const f of onDisk) if (!referenced.has(f)) problems.push(`src/fonts/files/${f} is not referenced by fonts.css`);
  const bare = fontsCss.match(/font-family:\s*['"]?(Inter Tight|Google Sans Flex|Noto Sans JP)['"]?\s*;/);
  if (bare) problems.push(`fonts.css declares the bare family name "${bare[1]}" — must be the "… Variable" name (see the note in fonts.css)`);
  report(`fonts.css + fonts-ja.css and src/fonts/files agree (${onDisk.size} files)`, problems);
}

if (failed) {
  console.log('\ncheck failed');
  process.exit(1);
}
console.log('\nall checks passed');
