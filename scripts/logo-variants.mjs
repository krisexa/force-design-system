/**
 * Derives every logo and mark variant from the two black sources, so the set
 * can never drift: edit exaforce-logo-black.svg or exaforce-mark-black.svg
 * and run `npm run logos`.
 *
 * For each of `logo` (wordmark) and `mark` (icon), writes:
 *   -black.svg    ink #231f20 (the wordmark's brand ink; the mark is
 *                 normalised to it so the two match side by side).
 *                 For light backgrounds.
 *   -white.svg    ink #ffffff. For dark backgrounds, email, PDF, social images.
 *   -current.svg  fill: currentColor — takes the text colour of wherever it
 *                 sits, so it follows the site's theme toggle. Works INLINED
 *                 (<svg> in the HTML or <use>), not as <img src>.
 *   -auto.svg     black, switching to white under the OS's dark colour
 *                 scheme. Works as <img src>, but follows the OS setting,
 *                 not a site's own toggle. Use where nothing else can react:
 *                 README images, docs sites, embeds you don't style.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'logo');
const BLACK = '#231f20';
const WHITE = '#ffffff';

/* Normalise a source: strip the XML prolog, editor comments and ids, and
   express every fill as a single CSS rule so the variants are one substitution. */
function normalise(svg, className) {
  /* Editor exports express fill-rule through a class in a <style> block
     (Illustrator: `.st1 { fill-rule: evenodd }`). Find those classes so the
     rule can be kept ON THE PATHS that had it — and only those. The wordmark's
     letterforms need even-odd for their counters; the X mark does not have it. */
  const evenOddClasses = new Set();
  for (const m of svg.matchAll(/([^{}]+)\{[^{}]*fill-rule:\s*evenodd[^{}]*\}/g)) {
    for (const sel of m[1].split(',')) {
      const c = sel.trim().replace(/^\./, '');
      if (c) evenOddClasses.add(c);
    }
  }
  const inner = svg
    .replace(/<\?xml[^>]*\?>\s*/g, '')
    .replace(/<!--[\s\S]*?-->\s*/g, '')
    .replace(/<defs>\s*<style>[\s\S]*?<\/style>\s*<\/defs>\s*/g, '')
    .replace(/<style>[\s\S]*?<\/style>\s*/g, '')
    .replace(/\sfill="(black|#000|#000000|#231f20|#18181b|#fff|#ffffff|currentColor)"/gi, '')
    .replace(/\sfill="none"/g, '');
  const viewBox = /viewBox="([^"]+)"/.exec(inner)[1];
  const paths = Array.from(inner.matchAll(/<path[^>]*\/>/g), (m) => m[0]);
  const body = paths
    .map((p) => {
      const cls = /\sclass="([^"]*)"/.exec(p);
      const evenOdd = /fill-rule="evenodd"/.test(p) || (cls && cls[1].split(/\s+/).some((c) => evenOddClasses.has(c)));
      const clean = p.replace(/\s(id|version|class|fill-rule)="[^"]*"/g, '');
      return clean.replace('<path', `<path class="${className}"${evenOdd ? ' fill-rule="evenodd"' : ''}`);
    })
    .join('\n  ');
  return { viewBox, body };
}

function render({ viewBox, body }, className, css, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${title}">
  <style>${css}</style>
  ${body}
</svg>
`;
}

const sources = {
  logo: { file: 'exaforce-logo-black.svg', title: 'Exaforce', cls: 'exaforce-logo' },
  mark: { file: 'exaforce-mark-black.svg', title: 'Exaforce', cls: 'exaforce-mark' },
};

for (const [kind, { file, title, cls }] of Object.entries(sources)) {
  const raw = readFileSync(join(dir, file), 'utf8');
  const n = normalise(raw, cls);
  const variants = {
    black: `.${cls}{fill:${BLACK}}`,
    white: `.${cls}{fill:${WHITE}}`,
    current: `.${cls}{fill:currentColor}`,
    auto: `.${cls}{fill:${BLACK}}@media (prefers-color-scheme:dark){.${cls}{fill:${WHITE}}}`,
  };
  for (const [name, css] of Object.entries(variants)) {
    const out = `exaforce-${kind}-${name}.svg`;
    writeFileSync(join(dir, out), render(n, cls, css, title));
    console.log(`wrote ${out} (${n.body.split('<path').length - 1} paths)`);
  }
}
