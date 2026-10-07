# Migrating a site onto the design system

The prompt below is what to give a Claude Code session opened inside a site
repo. It is the recipe that moved an internal site (2026-09-30). Fill in the two
placeholders, paste the whole thing.

---

Migrate this site onto the Exaforce Design System without changing how the site
behaves or looks beyond what the system itself dictates.

**The system.** Local repo at `this repository`, GitHub
`krisexa/force-design-system`, version `{VERSION}`. Read its `README.md` and
`CLAUDE.md` first. It provides: CSS custom-property tokens (primitives +
semantic, light/dark via `data-theme`), three self-hosted typefaces (Inter
Tight Variable with italic, Google Sans Flex Variable, Noto Sans JP Variable as
opt-in `fonts-ja.css`), `base.css` element defaults and `.type-*` classes,
`theme.js`, logo variants, icon sets, customer/investor/review logos, ribbon
presets JSON. It is hosted at `https://exaforce-design-system.pages.dev`
(`/v1/` floating, `/{VERSION}/` exact, `/manifest.json`) and the repository
is public.

**This site.** `{ONE LINE: stack, hosting, anything unusual — e.g. "Astro on
Cloudflare Pages, generates OG images with satori", or "vanilla HTML, no build
step, internal, defaults to dark"}`.

**How to consume, by shape.**
- No build step: either link the host (`<link rel="preconnect"
  href="https://exaforce-design-system.pages.dev" crossorigin>` then the
  `/v1/` or exact-version files), or vendor it the an internal site way: copy
  `dist/v1`, `dist/fonts` and `dist/manifest.json` into `shared/design-system/`
  (or this repo's equivalent shared folder), add a refresh script, and add a
  `_headers` rule making `/shared/design-system/fonts/*` immutable. Prefer the
  host for a public page that should pick up approved changes; vendor when the
  site must have no cross-origin requests. Either way, link in every page
  `<head>`, in this order and before the site's own stylesheets: `theme.js`
  (synchronous, with `data-key` set to whatever localStorage key the site
  already uses for its theme, and `data-default="dark"` only if the site
  defaults to dark today), then `fonts.css`, `tokens.css`, and `fonts-ja.css`
  on pages that render Japanese.
- Build step (Astro/Vite): depend on the release tag,
  `"@exaforce/design-system": "github:krisexa/force-design-system#v{VERSION}"`
  (the repo is public, so this resolves on Cloudflare Pages; while it was
  private it failed silently there and a bundler site lost two days of deploys), or vendor
  it: copy the release's `package.json` and `src/` into `vendor/design-system/`
  with a sync script like a bundler site's `scripts/sync-design-system.mjs` and
  depend on it as `"@exaforce/design-system": "file:vendor/design-system"`.
  Then replace the local token and font imports with
  `@import '@exaforce/design-system'` (or `tokens.css` + `fonts.css` à la
  carte, plus `fonts-ja.css` where Japanese renders). Delete the local copies
  of `primitives.css`, `semantic.css`, the `@font-face` blocks and the
  `@fontsource-variable/*` dependencies. Keep the site's Tailwind `@theme`
  bridge exactly as it is; it reads tokens, it does not own them. Serve
  `theme.js` from `public/` or inline it in the layout head.

**Procedure.**
1. Inventory before touching anything: every `font-family`, every
   `@font-face`, every request to `fonts.googleapis.com`/`fonts.gstatic.com`,
   every hex/rgb/oklch literal, every `--custom-property` the site defines,
   every theme/localStorage mechanism, every logo and icon file, every
   reference to `cdn.prod.website-files.com`. Report the counts.
2. Map the site's own variables onto semantic tokens by VALUE, not by name
   (`--bg` → `--color-surface`, `--surface` → `--color-surface-raised`,
   `--text-dim` → `--color-text-muted`, and so on). Where the site's
   vocabulary is used widely, keep the old names as aliases of the tokens in
   one place and mark them deprecated, rather than rewriting every file.
   Accent tints become `color-mix(in srgb, var(--color-accent) N%, transparent)`.
3. Font stacks: `var(--font-family-base)` / `--font-family-heading` /
   `--font-family-mono` / `--font-family-ja`. Where a stack must interleave
   another face, name ours as `'Inter Tight Variable'`, `'Google Sans Flex
   Variable'`, `'Noto Sans JP Variable'`. Never the bare `Inter Tight` or
   `Google Sans Flex`; a third-party stylesheet can claim those names.
4. Theme: replace the site's own apply/save code with `theme.js` and its
   `ExaforceTheme.get()/set()` API and `[data-theme-toggle]` wiring. Keep the
   site's storage key so saved choices survive. Remove inline background hacks
   that pre-set colours before CSS loads; the stylesheet is render-blocking.
5. Assets: wordmark from `assets/logo/` (inline `-current` if the markup is
   yours, `-black`/`-white` as `<img>`, or `-black` + `filter: var(--logo-filter)`);
   customer logos from `assets/logos/customers/<id>-{black,white,color}.svg`.
   Delete the site's own copies once nothing references them.
6. If a colour or size cannot be expressed with an existing semantic token,
   STOP and say so rather than hardcoding: the token is missing from the
   system and should be added there (its `npm run check` must pass).

**Do not touch.** Anything the site's docs mark as intentionally standalone:
email-safe HTML with inline hex and Arial, ribbon shader hex ramps, satori/OG
image generation and the static font files it needs, canvas export code that
needs plain hex (update its constants to the system's values with a comment,
keep them hex), analytics, CSP, redirects. Site layout CSS, components and
page blocks stay in the site; the system is tokens, type, assets, theming.

**Verify before reporting**, in a real browser (headless Chrome via the
DevTools protocol is fine): no resource loads from any host but the site's
own; `document.fonts` shows the `… Variable` faces loaded; the body and
heading computed font-families are the system's; the theme toggle sets
`data-theme` and persists under the existing key; no 404s in the server log;
screenshots of every page type in both themes look right; any export path
(PNG/PDF/canvas) still produces correct output. Run the site's own build and
link checks if it has them.

**Report** everything changed and everything deliberately left, with the
before/after request and byte counts for fonts and CSS. Commit with a message
that records the mapping decisions; do not push unless told, because a push
deploys.

---

Notes from the tools migration worth carrying over: the accent moving from
blue to indigo is expected; a site that used one grey for "inputs, toggles,
nested surfaces" maps best onto `--color-control-secondary`; six of its
customer logo files had drifted from the current pack, so replacing rather
than diffing was right.
