# Exaforce Design System

The one place brand-level web assets live: design tokens, the three self-hosted
typefaces, the logo and icon sets, the product icon library, customer and investor logos, favicons, the
ribbon shader presets, and the theme script. Every Exaforce web property takes
them from here. Nothing brand-level is copied into a site by hand again.

Hosted on Cloudflare Pages at `https://exaforce-design-system.pages.dev`
(floating `/v1/`, exact `/1.x.y/`; see *Hosting*). The repository is public,
so a bundler site can also depend on it by git tag. Consumers that already
carry a copy may keep doing so; see *Using it*.

## Development entry points

Both Claude Code and Codex use [AGENTS.md](AGENTS.md). Read
[PROJECT_STATUS.md](PROJECT_STATUS.md) for task ownership, audit findings and the
latest handoff. CLAUDE.md imports the shared instructions. Use one agent per
working tree; use separate worktrees for concurrent tasks.

This is plain CSS, HTML and browser JavaScript, built by Node ESM scripts using
only the standard library. There are no npm runtime or development dependencies,
CMS, database, application backend or configured external API credentials.
GitHub Actions validates and tags releases; Cloudflare Pages hosting is documented
below, but live account settings must be verified separately.

## What is in it

```
src/
  tokens/primitives.css   raw values: the Tailwind v4 palette (oklch), sizes, type scale, motion
  tokens/semantic.css     what components use: --color-surface, --type-h1-size, … with light + dark
  fonts/fonts.css         @font-face for Inter Tight Variable (upright + italic) and Google Sans Flex Variable
  fonts/fonts-ja.css      Noto Sans JP Variable — linked IN ADDITION by pages with Japanese
  fonts/files/*.woff2     148 font subsets/slices total (verified by npm run check)
  base.css                element defaults, focus ring, .type-* classes, .text-* helpers
  theme.js                applies the saved light/dark/system choice before paint; toggle API
  index.css               fonts + tokens + base, for bundlers
  tokens.css              tokens only, for bundlers
  assets/logo/            wordmark and mark: black, white, currentColor, auto (OS dark mode)
  assets/icons/           platform (15, first-party marks), nav (47), trust (8), chain (3), ui (3)
  assets/product-icons/   the product's own icons (UI, entities, apps, services, flags, graph nodes) + index.json; generated, see *Product icons*
  assets/avatars/exabots/ 32 Exabot SVGs across four colorways + index.json and usage guide
  assets/favicon/         favicon.svg/.ico, apple-touch-icon, PWA icons, site.webmanifest
  assets/logos/customers/ 25 customers × -color / -black / -white (fixed ink, never recolour)
  assets/logos/investors/ 9 investor marks, currentColor
  assets/logos/review-marks/  G2 and Gartner, -color / -white
  assets/email/           logo JPEG + social icons for email signatures (source; served from the marketing site at stable paths)
  assets/fonts/           installable variable TTFs of the three typefaces + their OFL licences (for installing locally; the web uses fonts/)
  ribbon/presets.json     ribbon shader colourways and forms — the one file the studio and every site read
  site/_header.html, _header.css  the one site header (lockup, page nav, theme toggle); build.mjs injects it into every page below and marks the current page
  site/ribbon-shader-studio.html  the Ribbon Shader Studio, presets injected at build
  site/index.html         the styleguide, published at the root of the Pages site
  site/404.html           served for any missing path; names the published channels
scripts/
  logo-variants.mjs       regenerates the white/current/auto logo files from the black sources
  product-icons.mjs       regenerates assets/product-icons/ from the product icon sheet exports
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
fine.

Historical account retained from the previous README (not independently verified
in the 2026-10-19 audit): **a private
GitHub dependency does not work on Cloudflare Pages.** A site depended on
`github:krisexa/force-design-system#tag`, every laptop built fine, and every
Pages build failed silently for days because the build container has no
GitHub credentials. Production sat on a stale commit while local builds were
green. The repository is public; if it ever goes private again, every
consumer must vendor.

### No build step

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
(a shared folder such as `shared/design-system/`, with a one-line
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

Or vendor the package and depend on the copy (a sync script clones a tag,
copies `package.json` and `src/` into `vendor/design-system/`, and
reinstalls):

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

For the site the tokens came from: its two token files and font declarations
are byte-for-byte what this package ships, so the switch is replacing those
imports and deleting the local copies. Its Tailwind
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
5. After explicit authorization, commit and push. CI checks, builds, and tags
   a new version on `main` as `v<version>`.
   Cloudflare Pages builds `main` with `npm run build:pages` into `dist` and
   the release is live under `/v1/` and `/<version>/` a minute or two later.

If `src/` changes without a version bump after the version has been tagged,
`npm run build:pages` refuses to build (and so CI and Pages fail) rather than
republish an immutable path with different bytes.

Releases require explicit authorization before committing or pushing. A rollback
that changes published bytes needs a new version; never rewrite an immutable path.

## Hosting

Documented hosting target (live account configuration not verified in this audit):
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
changed is stored once. Output size grows with release history; measure `dist/`
and verify current Pages limits before releasing. See PROJECT_STATUS.md for the
latest observed size. Release builds stop if tag fetching fails, before replacing
`dist/`. For local offline preview only, run
`node scripts/build.mjs --releases --offline-releases`; CI/Pages rejects that flag.

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
ramp or form back into the JSON, bump the version. A site that still carries
its own copy, with site-specific fields on top, should read the published JSON
instead.

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
`node_modules/@fontsource-variable/{inter-tight,google-sans-flex}/files/` of
any install into `src/fonts/files/`, and regenerate the declarations in
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

A fifth approach: `-black` as `<img>` with `filter: var(--logo-filter)`, a
semantic token that inverts it in dark mode.
That also follows the toggle and works for any fixed-colour asset.

The black files are the sources; `npm run logos` regenerates the other three
from them. Three slightly different wordmark SVGs were in circulation; this is
the canonical one. The mark is normalised from pure black to the wordmark's
`#231f20` so the two match side by side.

## Exabot avatars

Eight Exabot forms in four colorways (32 SVGs) live in `assets/avatars/exabots/`:
Force, Lightning bolt, Long pill, Magnifying glass, Shield, Spark, Square and
Triangle. Colorways: `full-spectrum`, `cool`, `soft-pastel` and `dark-spectrum`.
`index.json` lists their labels, colorways, relative file paths and dimensions.
Identify a variant by the pair of `id` (form) and `colorway`.
See [avatar usage](src/assets/avatars/exabots/README.md) for sizing and brand rules.
The supplied SVGs are preserved unchanged, with their gradients and opaque faces.

After the next release, hosted usage is:

```html
<img
  src="https://exaforce-design-system.pages.dev/v1/assets/avatars/exabots/full-spectrum/exabot-force-full-spectrum.svg"
  width="64" height="64" alt="Force Exabot"
>
```

Bundler usage (use the imported URL as an image source):

```js
import forceAvatar from '@exaforce/design-system/assets/avatars/exabots/full-spectrum/exabot-force-full-spectrum.svg?url';
```

Use `alt=""` when an adjacent label already conveys the same information.
For another colorway, change both the directory and filename suffix, for example
`cool/exabot-force-cool.svg` or `soft-pastel/exabot-shield-soft-pastel.svg`.
The three additional colorways ship in 1.3.0; use `/1.3.0/` to pin them.
These paths become available on the host only after an authorized release.

## Product icons

`assets/product-icons/` is the Exaforce product's own icon library, so
marketing can rebuild any product screen or graph faithfully: 1,944 SVGs from
the two product icon sheets ("Exaforce Icons" and "Exaforce Graph Node Types
and Icons"). Each file is named by the product's icon name:

| Path | Set |
|---|---|
| `exf/…` | product UI (549) |
| `severity/…` | severity badges |
| `entity/<category>/…` | entity types, with category background and icon colours |
| `app/…` | SaaS apps (415) |
| `aws/`, `azure/`, `google/`, `github/`, `oracle/`, `atlassian/`, `box/`, `okta/`, `idp/` | cloud and identity services |
| `flag/<iso code>.svg` | country flags (lower-case code; `flag/unknown.svg`) |
| `graph/<Category>/…` | graph node categories and sub-categories (fill, border, icon colours) |
| `graph/property/…`, `graph/operation/…` | graph node enrichments and edge operations |

`index.json` lists every icon with its set, `label`, search `aliases`,
`colors` and `flags` (`noDarkMode`, `allowBackground`, …) exactly as the
product uses them. Colours are hex, or `var(--exf-color-<hue>-<step>)`: the
same Tailwind palette step as this system's `--<hue>-<step>`. `themeable: true`
means the drawing is `currentColor` only, so it takes the text colour when
inlined; the rest carry fixed brand colours. The sheet-to-node-type mappings
are deliberately not included.

The sheets are the source; never edit the output. To refresh, export every tab
the script lists (File → Download → CSV per tab, or Sheets API JSON) and run
`npm run product-icons -- <exports…>`. It deletes and rewrites the folder,
refuses a partial export, rejects SVGs with scripts or external references,
and warns about rows it skipped or names the sheets reuse for different
drawings.

## Migrating a site

MIGRATING.md is the prompt to hand a Claude Code session in a site repo. It is
the recipe every site so far has been moved with.

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

Use patched Node 22 as selected by `.node-version`, `engines` and CI. No dependency
installation is needed. Build first, then serve; the server has no watch/rebuild
loop. Rebuild and refresh after edits. Builds recreate `dist/`.

| Command | Actual purpose |
|---|---|
| `npm run check` | Six categories of token, dark-theme, font and inline-script invariants |
| `npm run build` | Runs `prebuild` checks, then generates this version and floating major |
| `npm run build:pages` | Checks and builds historical releases; requires successful remote tag fetch |
| `npm run serve` | Serves existing `dist/`; default port 3000; stop with Ctrl-C |
| `npm run logos` | Rewrites all eight logo/mark variants, including normalized black sources |
| `npm test` | Built-in Node regression tests for release integrity and preview error handling |
| Lint / typecheck | No scripts or dedicated configurations present |

Optional syntax checking: `node --check scripts/build.mjs` (likewise the other
`.mjs` scripts and `src/theme.js`). This does not validate browser behavior or
inline scripts. CI runs regression tests, invariants, the release build and artifact upload. Actions
are pinned to verified commit IDs, with read-only default permissions and write
permission scoped to release tagging. Browser, accessibility, lint and type checking
are not configured.

### Environment and local configuration

No `.env` loading or required application secrets. Recognized environment names:

- `PORT`: preview server port, default 3000; for example `PORT=8080 npm run serve`.
- `CI`, `CF_PAGES`: truthy values select shallow tag fetching in release builds;
  normally supplied by the build environment; also forbid offline release mode.
- `GITHUB_STEP_SUMMARY`, `GITHUB_SHA`: used by GitHub Actions for reporting/tagging.

Do not commit credentials. `.gitignore` covers generated files, `.env` variants
(except example templates), private key files, local cloud credentials and Claude
local settings. Review staged files even when ignores are present. GitHub repository
access and Cloudflare Git integration are account settings, not application env
requirements. The preview server binds to `127.0.0.1`, accepts a numeric `PORT`
from 1 through 65535, and does not reproduce generated Pages headers/caching.

### Verification limits and historical notes

Statements about prior migrations, the initial token extraction, repository
visibility changes and consuming-site adoption are inherited documentation, not
verified current requirements. The earlier CLAUDE.md recorded extraction on
2026-09-29 and pending adoption; adoption is unverified. Git remote configuration
does not prove public visibility or deployment health. README hosting capacity
figures are historical estimates; measure generated output and check current
hosting limits before release. See PROJECT_STATUS.md for observed results and
remaining manual checks.
