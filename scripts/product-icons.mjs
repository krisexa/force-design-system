/**
 * Regenerates src/assets/product-icons/ from the two product icon sheets
 * ("Exaforce Icons" and "Exaforce Graph Node Types and Icons"), so marketing
 * can rebuild any product UI or graph with the product's own icons, names
 * and colours. The sheets are the source of truth; never edit the output.
 *
 *   npm run product-icons -- <export> [<export> …]
 *
 * An export is one tab, either
 *   .csv   File → Download → Comma-separated values (current sheet). The
 *          tab name is read from Google's file name, "<Sheet> - <tab>.csv".
 *   .json  a Sheets API response: spreadsheets.values.get ({range, values})
 *          or spreadsheets.get with grid data ({sheets: [...]}), any number
 *          of tabs per file.
 * Tabs not listed in TABS below (mappings, node types, line types, scratch
 * sheets) are ignored. Every listed tab must be present, so a partial export
 * can't silently delete a set.
 *
 * Writes <name>.svg for every row with SVG markup, where <name> is the
 * product's own icon name (exf/account, app/okta, entity/compute/…,
 * graph/Compute/Placeholder), and index.json: label, aliases and colours per
 * icon. The output folder is deleted and rewritten on every run.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'product-icons');

/* Sheet tab → set. `prefix` is prepended to the icon name (graph names would
   otherwise collide with the entity set's Compute/…, Data/…). */
const TABS = {
  'icons-exaforce': { set: 'exaforce', title: 'Exaforce product UI' },
  'icons-severity': { set: 'severity', title: 'Severity badges' },
  'icons-categories': { set: 'entity', title: 'Entity categories' },
  'icons-saas-app': { set: 'app', title: 'SaaS apps' },
  'country-flag': { set: 'flag', title: 'Country flags' },
  'icons-service-aws': { set: 'service-aws', title: 'AWS services' },
  'icons-service-azure': { set: 'service-azure', title: 'Azure services' },
  'icons-service-google': { set: 'service-google', title: 'Google services' },
  'icons-service-github': { set: 'service-github', title: 'GitHub services' },
  'icons-service-oracle': { set: 'service-oracle', title: 'Oracle services' },
  'icons-service-atlassian': { set: 'service-atlassian', title: 'Atlassian services' },
  'icons-service-box': { set: 'service-box', title: 'Box services' },
  'icons-service-okta': { set: 'service-okta', title: 'Okta services' },
  'icons-service-idp': { set: 'service-idp', title: 'Identity provider services' },
  'Category Icons': { set: 'graph-category', title: 'Graph node categories', prefix: 'graph/' },
  'Sub-Category Icons': { set: 'graph-subcategory', title: 'Graph node sub-categories', prefix: 'graph/' },
  'Enrichment Icons': { set: 'graph-enrichment', title: 'Graph node enrichments', prefix: 'graph/' },
  'Operation Icons': { set: 'graph-operation', title: 'Graph edge operations', prefix: 'graph/' },
};

/* Sheet column → index.json colour key. Values are kept exactly as the
   product uses them: hex, or the product's var(--exf-color-<hue>-<step>),
   which names the same Tailwind palette step as this system's --<hue>-<step>. */
const COLOURS = {
  'Icon Color Light': 'light',
  'Icon Color Dark': 'dark',
  'Background Color': 'background',
  Color: 'fill',
  'Border Color': 'border',
  'Icon Color': 'icon',
  'Icon Color Dark Theme': 'iconDark',
};
const FLAGS = {
  'No Dark Mode': 'noDarkMode',
  'Allow Background': 'allowBackground',
  'Allow Default Color': 'allowDefaultColor',
  'Has Generated Background': 'hasGeneratedBackground',
};

/* RFC 4180: quoted fields may hold commas, quotes ("") and newlines — the
   SVG column always does. */
function parseCsv(text) {
  const rows = [[]];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') field += '"', i++;
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') rows.at(-1).push(field), (field = '');
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      rows.at(-1).push(field), (field = ''), rows.push([]);
    } else field += c;
  }
  rows.at(-1).push(field);
  return rows.filter((r) => r.some((v) => v !== ''));
}

/* Collect tabs as arrays of rows, header first. A tab seen twice keeps the
   longer copy (a header-only peek must not shadow the full export). */
const tabs = {};
const keep = (title, rows) => {
  if (!tabs[title] || tabs[title].length < rows.length) tabs[title] = rows;
};
const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: npm run product-icons -- <tab export .csv|.json> […]');
  process.exit(1);
}
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (file.endsWith('.csv')) {
    const m = /^.* - (.+)\.csv$/.exec(basename(file));
    keep(m ? m[1] : basename(file, '.csv'), parseCsv(text));
    continue;
  }
  const json = JSON.parse(text);
  if (json.values) keep(json.range.split('!')[0].replace(/^'|'$/g, ''), json.values);
  for (const sheet of json.sheets || []) {
    const rowData = sheet.data?.[0]?.rowData || [];
    keep(sheet.properties.title, rowData.map((r) => (r.values || []).map((v) => v.formattedValue ?? '')));
  }
}
const missing = Object.keys(TABS).filter((t) => !tabs[t]);
if (missing.length) {
  console.error(`missing tabs: ${missing.join(', ')}. Export every tab listed in TABS.`);
  process.exit(1);
}

/* Reject anything that could execute or phone home when inlined. Embedded
   data: images are fine (three app logos are raster-in-SVG). */
function unsafe(svg) {
  return /<script|<foreignObject|\son[a-z]+\s*=|(?:xlink:)?href\s*=\s*"(?!#|data:image\/)/i.test(svg);
}

const icons = new Map();
const sets = {};
const warnings = [];
for (const [tab, { set, title, prefix = '' }] of Object.entries(TABS)) {
  const [header, ...rows] = tabs[tab];
  sets[set] = { title, sheet: tab, count: 0 };
  let skipped = 0;
  for (const row of rows) {
    const r = Object.fromEntries(header.map((h, i) => [h.trim(), (row[i] ?? '').trim()]));
    const svg = r['SVG Icon'];
    const raw = set === 'flag' ? `flag/${r['Country Code']}` : r['Icon Name'];
    if (!raw && !svg) continue;
    if (!svg || !svg.startsWith('<svg')) {
      skipped++;
      continue;
    }
    const name = prefix + raw.replace(/\s+/g, '_');
    const file = (set === 'flag' ? name.toLowerCase() : name) + '.svg';
    if (unsafe(svg)) {
      warnings.push(`${name}: unsafe SVG markup, skipped`);
      continue;
    }
    /* Sub-category rows name a product node type, often several per icon
       (that's the mapping, deliberately left out); label by the icon. */
    const label =
      r.Label || r.Description || r['Country Name'] || (r['Sub-category'] ? '' : r.Category) || raw.split('/').pop();
    const aliases = (r['Alternate Names'] || '').split(',').map((a) => a.trim()).filter(Boolean);
    const colours = {};
    for (const [col, key] of Object.entries(COLOURS)) if (r[col]) colours[key] = r[col];
    const flags = Object.entries(FLAGS).filter(([col]) => r[col]).map(([, key]) => key);

    const seen = icons.get(file.toLowerCase());
    if (seen) {
      /* The sheets reuse a name for rows that share one drawing (several
         policy types → entity/policy/access_review). Same drawing: fold the
         row's label and aliases in. Different drawing: first row wins. */
      if (seen.svg !== svg) warnings.push(`${name}: duplicate name with a different drawing in ${tab}; kept the first`);
      else if (seen.entry.set !== set) warnings.push(`${name}: also in ${seen.entry.set}; kept that one`);
      else if (JSON.stringify(seen.entry.colors || {}) !== JSON.stringify(colours))
        warnings.push(`${name}: duplicate rows with different colours in ${tab}; kept the first`);
      else for (const a of [label, ...aliases]) if (a !== seen.entry.label && !seen.entry.aliases?.includes(a)) (seen.entry.aliases ||= []).push(a);
      continue;
    }
    const entry = { name, set, file, label };
    if (aliases.length) entry.aliases = aliases;
    if (set === 'flag') entry.code = r['Country Code'];
    if (Object.keys(colours).length) entry.colors = colours;
    if (flags.length) entry.flags = flags;
    entry.themeable = !/(?:fill|stroke|stop-color)="(?!none|currentColor)/i.test(svg);
    icons.set(file.toLowerCase(), { svg, entry });
    sets[set].count++;
  }
  if (skipped) warnings.push(`${tab}: ${skipped} row(s) without SVG markup skipped`);
}

/* Most exports name their clip paths and gradients id="a". Inline two on one
   page and the second icon draws with the first one's clip. Prefix every id
   with the icon's name so any number can be inlined together. */
function scopeIds(svg, name) {
  const prefix = 'pi-' + name.replace(/[^A-Za-z0-9]+/g, '-') + '-';
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [, id] of svg.matchAll(/\sid="([^"]+)"/g)) {
    svg = svg
      .replace(new RegExp(`(\\sid=")${esc(id)}"`, 'g'), `$1${prefix}${id}"`)
      .replace(new RegExp(`url\\(#${esc(id)}\\)`, 'g'), `url(#${prefix}${id})`)
      .replace(new RegExp(`(href=")#${esc(id)}"`, 'g'), `$1#${prefix}${id}"`);
  }
  return svg;
}

rmSync(out, { recursive: true, force: true });
for (const { svg, entry } of icons.values()) {
  mkdirSync(dirname(join(out, entry.file)), { recursive: true });
  const clean = svg.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').trim();
  writeFileSync(join(out, entry.file), scopeIds(clean, entry.name) + '\n');
}
const index = {
  about:
    'Generated by scripts/product-icons.mjs from the product icon sheets. Do not edit. ' +
    'colors are as the product uses them; var(--exf-color-<hue>-<step>) is the same palette step as this system\'s --<hue>-<step>. ' +
    'themeable: the drawing uses only currentColor, so it takes the surrounding text colour when inlined.',
  sets,
  icons: [...icons.values()].map((i) => i.entry),
};
writeFileSync(join(out, 'index.json'), JSON.stringify(index, null, 1) + '\n');

for (const [set, s] of Object.entries(sets)) console.log(`  ${set.padEnd(18)} ${String(s.count).padStart(4)}  ${s.title}`);
console.log(`  ${icons.size} icons → src/assets/product-icons/`);
for (const w of warnings) console.warn(`  warning: ${w}`);
