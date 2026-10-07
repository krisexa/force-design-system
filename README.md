# Exaforce Design System

The one place brand-level web assets live: design tokens, the three self-hosted
typefaces, the logo and icon sets, customer and investor logos, favicons, the
ribbon shader presets, and the theme script. Every Exaforce web property takes
them from here. Nothing brand-level is copied into a site by hand again.

Consumers, and where each stands (2026-10-07):

| Property | Stack | How it consumes | Status |
|---|---|---|---|
| an internal site | vanilla HTML, Cloudflare Pages | built copy vendored under `shared/design-system/`, refreshed by its `update-design-system.sh` | live since 2026-09-30 |
| a bundler site | Astro 7, pnpm, Cloudflare Pages | package vendored under `vendor/design-system/` (`file:` dependency), refreshed by `pnpm sync:design-system <tag>` | live since 2026-09-30 |
| a campaign site | vanilla HTML | still a hand-copied, drifted set of these files | next |
| the website | Astro 7 + Sanity | still its own copy of the token files, the origin of this system | after campaigns |

Hosted on Cloudflare Pages at `https://exaforce-design-system.pages.dev`
(floating `/v1/`, exact `/1.x.y/`; see *Hosting*). The repository is public,
so a bundler site can also depend on it by git tag. Consumers that already
carry a copy may keep doing so; see *Using it*.

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
  assets/logos/customers/ 25 customers × -color / -black / -white (fixed ink, never recolour)
  assets/logos/investors/ 9 investor marks, currentColor
  assets/logos/review-marks/  G2 and Gartner, -color / -white
  assets/email/           logo JPEG + social icons for email signatures (source; served from the website)
  assets/fonts/           installable variable TTFs of the three typefaces + their OFL licences (for the tools site's Typography page; the web uses fonts/)
  ribbon/presets.json     ribbon shader colourways and forms — the one file the studio, website and tools read
  site/ribbon-shader-studio.html  the Ribbon Shader Studio, presets injected at build
  site/index.html         the styleguide, published at the root of the Pages site
  site/404.html           served for any missing path; names the published channels
scripts/
  logo-variants.mjs       regenerates the white/current/auto logo files from the black sources
  check.mjs               invariants (no literals in semantic, every var() resolves, dark parity, font files)
  build.mjs               produces dist/; with --releases, also every tagged release (the Pages build)
```

Deliberately **not** in it: page and component CSS, buttons and cards, the
Tailwind bridge, anything that belongs to one site. The system is tokens, type,
assets, shader data and theming. Components can't be shared across vanilla and
Astro sites anyway.

## Using it

Two shapes of consumer. A site without a build step links the host or vendors
the build; a bundler site depends on the package by git tag or vendors it.
Vendoring costs one extra step per release and buys independence from this
host: the fonts ship from the site's own origin, nothing cross-origin, nothing
to preconnect to. Linking the host costs one preconnect and buys releases
reaching the site within an hour with no commit in the site repo. Both are
fine; the tools site and a bundler site vendor because they were migrated while the repo
was still private.

A lesson from that period, kept here so it is not relearned: **a private
GitHub dependency does not work on Cloudflare Pages.** a bundler site depended on
`github:krisexa/force-design-system#tag`, every laptop built fine, and every
Pages build from 2026-09-30 to 10-02 failed silently because the build
container has no GitHub credentials. Production sat on a stale commit while
local builds were green. The repository has been public since 2026-10-07; if
it ever goes private again, every consumer must vendor.

### No build step (an internal site, campaign pages)

Link the host, in this order and before the site's own stylesheets:

```html
<link rel="preconnect" href="https://exaforce-design-system.pages.dev" crossorigin>
<script src="https://exaforce-design-system.pages.dev/v1/theme.js"></script>
<link rel="stylesheet" href="https://exaforce-design-system.pages.dev/v1/exaforce.css">
```

The `crossorigin` on the preconnect matters: fonts are fetched in CORS mode,
and a preconnect without it opens a connection the font request cannot reuse.
Pin `/1.1.6/` in place of `/v1/` on a page that must not move.

Or vendor: copy `dist/v1`, `dist/fonts` and `dist/manifest.json` into the site
(the tools repo keeps them under `shared/design-system/` with a one-line
refresh script) and link the same two tags from the local path, plus a
`_headers` rule making the local fonts folder immutable.

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

Depend on a release tag (the repository is public, so this resolves on
Cloudflare Pages too):

```sh
npm install github:krisexa/force-design-system#v1.1.6
```

Or vendor the package and depend on the copy (what a bundler site does; its
`scripts/sync-design-system.mjs` clones a tag, copies `package.json` and
`src/` into `vendor/design-system/`, and reinstalls):

```json
"@exaforce/design-system": "file:vendor/design-system"
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
| `/1.x.y/…` | exact (the current version is in `package.json` and `manifest.json`) | immutable, one year |
| `/fonts/…` | content-hashed woff2, shared by both | immutable, one year |

Releases are also git tags (`v1.1.6` and so on): what the bundler sites
depend on, what the vendoring scripts pull, and what the Pages build
republishes. CI creates the tag for a new `version` on every push to `main`,
so a release is a version bump landing on `main`.

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
5. Commit, push. CI checks, builds, and tags the commit `v<version>`.
   Cloudflare Pages builds `main` with `npm run build:pages` into `dist` and
   the release is live under `/v1/` and `/<version>/` a minute or two later.

If `src/` changes without a version bump after the version has been tagged,
`npm run build:pages` refuses to build (and so CI and Pages fail) rather than
republish an immutable path with different bytes.

Kris approves after the fact; the floating `/v1/` path is what makes a
revert a one-line version bump rather than a hunt across sites.

## Hosting

Cloudflare Pages, Git integration on `krisexa/force-design-system`, production
branch `main`, like the other Exaforce sites. Project settings:

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `npm run build:pages` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node | from `.node-version` (22); nothing to install |

`npm run build:pages` runs the checks, builds the working tree's version, then
fetches the `v1.*` tags and rebuilds each one with its own build script into
the same `dist/`. A deployment therefore carries every 1.x ever released, so a
page pinned to `/1.1.4/` keeps working after 1.1.5 and 1.1.6 ship. Fonts are
content-hashed, so the versions share one `fonts/` folder and a file that never
changed is stored once. The whole deployment is about 60 MB and 1,700 files,
well inside Pages' limits (20,000 files, 25 MB each).

`_headers` is generated with the build: open CORS and `nosniff` everywhere,
`noindex` for the host, a year's immutable cache on `/fonts/` and every exact
version, an hour plus a day of stale-while-revalidate on `/v1/`. Preview
deployments (any branch other than `main`) get the same files on a
`<hash>.exaforce-design-system.pages.dev` URL, which is how to look at a change
on a real Pages origin before it lands.

A custom domain (`design.exaforce.com`, say) is a DNS change in the Pages
project; every consumer then changes one hostname. Until then the
`pages.dev` hostname is the one to link.

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

## Licence and visibility

LICENSE.md: the code is MIT, the typefaces are SIL OFL 1.1, the Exaforce marks
are all rights reserved, and the customer, investor and review logos belong to
their owners and are included only for Exaforce's own properties. The
repository is public (since 2026-10-07): everything in `dist/` is served
unauthenticated to browsers anyway, and a private repository breaks any
consumer that depends on it by URL from a build environment without
credentials (see *Using it*).

## Local

```sh
npm run check        # invariants
npm run build        # dist/ with the working tree's version only
npm run build:pages  # what Pages runs: checks, this version, and every tagged release
npm run serve        # http://localhost:3000, the styleguide against the built files;
                     # missing paths return a real 404 and render 404.html, like Pages
```

No dependencies. Node 20 or newer.
