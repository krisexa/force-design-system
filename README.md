# Exaforce Design System

The one place brand-level web assets live: design tokens, the two self-hosted
typefaces, the logo and icon set, favicons, and the theme script. Every
Exaforce web property links to it or installs it. Nothing here is copied into a
site again.

Consumers today, and where each stands:

| Property | Stack | Status |
|---|---|---|
| an internal site | vanilla HTML, Cloudflare Pages | pilot: first to switch |
| a campaign site | vanilla HTML | carries a hand-copied, already-drifted set of these files |
| the website | Astro 7 + Sanity | the origin of these tokens; should become a consumer |

## What is in it

```
src/
  tokens/primitives.css   raw values: the Tailwind v4 palette (oklch), sizes, type scale, motion
  tokens/semantic.css     what components use: --color-surface, --type-h1-size, … with light + dark
  fonts/fonts.css         @font-face for Inter Tight Variable (upright + italic) and Google Sans Flex Variable
  fonts/fonts-ja.css      Noto Sans JP Variable — linked IN ADDITION by pages with Japanese
  fonts/files/*.woff2     17 Latin-face subsets (a Latin page downloads two) + 124 Noto JP slices
  base.css                element defaults, focus ring, .type-* classes, .text-* helpers
  theme.js                applies the saved light/dark/system choice before paint; toggle API
  index.css               fonts + tokens + base, for bundlers
  tokens.css              tokens only, for bundlers
  assets/logo/            wordmark and mark: black, white, currentColor, auto (OS dark mode)
  assets/icons/           platform (15, first-party marks), nav (47), trust (8), chain (3), ui (3)
  assets/favicon/         favicon.svg/.ico, apple-touch-icon, PWA icons, site.webmanifest
  assets/logos/customers/ 24 customers × -color / -black / -white (fixed ink, never recolour)
  assets/logos/investors/ 9 investor marks, currentColor
  assets/logos/review-marks/  G2 and Gartner, -color / -white
  assets/email/           logo JPEG + social icons for email signatures (source; served from the website)
  ribbon/presets.json     ribbon shader colourways and forms — the one file the studio, website and tools read
  site/ribbon-shader-studio.html  the Ribbon Shader Studio, presets injected at build
  site/index.html         the styleguide, published at the root of the Pages site
  site/404.html           served for any missing path; names the published channels
scripts/
  logo-variants.mjs       regenerates the white/current/auto logo files from the black sources
  check.mjs               invariants (no literals in semantic, every var() resolves, dark parity, font files)
  build.mjs               produces dist/ for Cloudflare Pages
```

Deliberately **not** in it: page and component CSS, buttons and cards, the
Tailwind bridge, ribbon shader presets, anything that belongs to one site. The
system is tokens, type, assets and theming. Components can't be shared across
vanilla and Astro sites anyway.

## Using it

### No build step (an internal site, campaign pages)

```html
<link rel="preconnect" href="https://HOST">
<script src="https://HOST/v1/theme.js"></script>
<link rel="stylesheet" href="https://HOST/v1/exaforce.css">
```

`theme.js` goes first and synchronously, so the page never paints in the wrong
theme. `exaforce.css` is fonts + tokens + base in one request. For tokens
without element defaults, link `fonts.css` and `tokens.css` instead.

A page that renders Japanese also links `fonts-ja.css`. Japanese is opt-in
per page because its 124 sliced `@font-face` declarations weigh about 30 KB
compressed, more than the rest of the system; the slices themselves only
download for glyphs the page uses. Mark Japanese content `lang="ja"` and it
sets entirely in Noto Sans JP, Latin letters included.

A site that should default to dark when the visitor has never chosen:
`<script src=".../theme.js" data-default="dark">`.

Then replace local variables with semantic tokens (`var(--color-surface)`,
`var(--color-text-primary)`, `var(--color-accent)`, `var(--font-family-base)`)
and delete the local `@font-face` and Google Fonts imports.

### With a bundler (Astro, Vite)

```sh
npm install github:exaforce/force-design-system#v1.0.0
```

```css
/* global.css */
@import '@exaforce/design-system';           /* fonts + tokens + base   */
/* or à la carte */
@import '@exaforce/design-system/fonts.css';
@import '@exaforce/design-system/tokens.css';
```

Vite rewrites the relative font URLs and fingerprints the files, so the fonts
ship from the site's own origin with no extra request to this host. Copy
`src/theme.js` into the layout as an inline script, or serve it from `public/`.
Assets import as URLs:
`import logo from '@exaforce/design-system/assets/logo/exaforce-logo-black.svg'`.
Font files too, for a `<link rel="preload">` that must match the bundled
`@font-face` URL:
`import inter from '@exaforce/design-system/fonts/files/inter-tight-latin-wght-normal.woff2?url'`.

For the website specifically: the two token files and the font
declarations in `global.css` are byte-for-byte what this package ships, so the
switch is replacing those imports and deleting the local copies. Its Tailwind
`@theme inline` bridge stays in the site; it reads the tokens, it doesn't own them.

## Versions and caching

The build publishes every release under two paths:

| Path | Meaning | Cache |
|---|---|---|
| `/v1/…` | floating: the newest 1.x | 1 hour, stale-while-revalidate a day |
| `/1.0.0/…` | exact | immutable, one year |
| `/fonts/…` | content-hashed woff2, shared by both | immutable, one year |

Link `/v1/` to receive approved changes within an hour of deploy. Pin an exact
version when a page must not move (a live event page the week of the event).

Rules that keep that safe:

- **Never republish an exact version with different bytes.** It is cached
  immutable everywhere it has been seen. Bump the version.
- **A change that would break a consuming page is a major bump** (`v2`), and
  `/v1/` keeps serving the last 1.x. Renaming or removing a token is breaking;
  adding one or changing a value is not.
- Font files are hashed by content, so a font upgrade is a new file name and
  the old one keeps serving to anything still pointing at it.

## Making a change

1. Edit `src/`. Semantic tokens reference primitives only; no literals. Both
   dark blocks in `semantic.css` must remap the same tokens (the check enforces it).
2. `npm run check`
3. Bump `version` in `package.json` (patch for values, minor for additions,
   major for renames/removals).
4. `npm run build` and open `dist/index.html` via `npm run serve` to eyeball
   the styleguide in both themes.
5. Commit, push. Cloudflare Pages builds with `npm run build`, output `dist`.

Kris approves after the fact; the floating `/v1/` path is what makes a
revert a one-line version bump rather than a hunt across sites.

## Ribbon shader

The ribbon gradient's colourways and forms live in `src/ribbon/presets.json`
and are published as `<channel>/ribbon-presets.json`. They are hex on
purpose: the shader takes them as linear-light uniforms, so they are not
tokens and never will be. The Ribbon Shader Studio at
`/ribbon-shader-studio.html` on the design-system host reads the same JSON
(injected at build). To retune: adjust in the studio, Copy settings, paste the
ramp or form back into the JSON, bump the version. The website's
`ribbon-presets.ts` and the tools' `ribbon.js` still carry their own copies
plus site-specific fields (poster gradients, scrims); pointing them at the
published JSON is the next step.

## Fonts

Inter Tight Variable (body), Google Sans Flex Variable (headings) and Noto
Sans JP Variable (Japanese), all SIL Open Font License 1.1, from Fontsource
(`inter-tight` 5.3.0, `google-sans-flex` 5.3.1, `noto-sans-jp` 5.3.0). The
two Latin stacks list Noto after their own face, so kana and kanji anywhere
fall through to it once `fonts-ja.css` is linked; `:lang(ja)` content uses
`--font-family-ja`, Noto first. The `… Fallback` faces are Arial resized with
`size-adjust` so text painted before the woff2 arrives has the same width and
line height, and the swap moves nothing. Their numbers are computed from these
exact files; recompute if a face is swapped.

Family names are always the `… Variable` ones. Never declare the bare
`Inter Tight`: HubSpot's form embed claims that name with its own `@font-face`
and once put a third-party font download and a layout shift on every page.

To refresh from Fontsource: copy the `*-wght-normal.woff2` files from
`node_modules/@fontsource-variable/{inter-tight,google-sans-flex}/files/` in the
website repo into `src/fonts/files/`, and regenerate the declarations in
`fonts.css` from each package's `index.css` (keep the `./files/` paths).

## Logo and mark

Two artworks, the wordmark (`logo`) and the icon (`mark`), each in four variants
under `assets/logo/`:

| File | Ink | Use it when |
|---|---|---|
| `exaforce-{logo,mark}-black.svg` | `#231f20` | on a light background, as `<img>` |
| `exaforce-{logo,mark}-white.svg` | `#ffffff` | on a dark background, as `<img>`; email, PDF, social images |
| `exaforce-{logo,mark}-current.svg` | `currentColor` | inlined in the HTML, so it follows the site's own theme toggle |
| `exaforce-{logo,mark}-auto.svg` | black, white under OS dark mode | as `<img>` where nothing else can react: READMEs, docs, embeds |

Which to pick, in order: inline `-current` if you can (it follows the theme
toggle and the text colour around it); `-black` or `-white` as `<img>` when you
know the background; `-auto` only when you control neither the markup nor the
theme. `-current` does nothing as an `<img src>` because an image can't see
the page's colour; browsers render it black.

the website uses a fifth approach: `-black` as `<img>` with
`filter: var(--logo-filter)`, a semantic token that inverts it in dark mode.
That also follows the toggle and works for any fixed-colour asset.

The black files are the sources; `npm run logos` regenerates the other three
from them. Three slightly different wordmark SVGs were in circulation (website,
tools, campaigns): this is the one on the website. The mark comes from the
tools repo, normalised from pure black to the wordmark's `#231f20` so the two
match side by side.

## Migrating a site

MIGRATING.md is the prompt to hand a Claude Code session in a site repo. It is
the recipe that moved an internal site and a bundler site.

## Local

```sh
npm run check   # invariants
npm run build   # dist/
npm run serve   # http://localhost:3000, the styleguide against the built files;
                # missing paths return a real 404 and render 404.html, like Pages
```

No dependencies. Node 20 or newer.
