# force-design-system

Exaforce's marketing design system: tokens, typefaces, brand assets, theme
script. Consumed by Exaforce's web properties, Astro and vanilla HTML alike.
README.md has the consumer-facing docs; this file is for working on the repo
itself. Do not name consuming sites, their repos or local paths anywhere in
this repository: it is public.

## Layering rule

- `src/tokens/primitives.css` is the only file allowed to contain literals.
  Colour primitives are the Tailwind v4 palette verbatim, in oklch.
- `src/tokens/semantic.css` maps primitives to intent and contains no literals.
  `npm run check` fails on a hex, rgb(), oklch() or a bare px/rem/ms value here.
- `src/base.css` reads semantic tokens only.
- Dark mode remaps semantic tokens only. Three states: `:root` (light),
  `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme='light'])`,
  and `:root[data-theme='dark']`. The two dark blocks are duplicated by hand and
  the check enforces they remap the same tokens to the same values. A token
  missing from one block keeps its light value there, which reads as a bug.

## Do not

- Do not add Tailwind, a build framework, or npm dependencies. The build and
  check scripts are plain Node so Cloudflare Pages builds them with nothing
  installed.
- Do not republish an exact version path (`/1.x.y/`) with different bytes. It
  is cached immutable. Bump `version` in package.json. CI tags every new
  version on `main`, and `npm run build:pages` refuses to build a tagged
  version whose `src/` differs, so forgetting the bump fails the deploy.
- Do not declare the bare family names `Inter Tight` or `Google Sans Flex`.
  Only `… Variable` and `… Fallback`. See the note at the top of fonts.css.
- Do not add site-specific CSS (buttons, cards, page blocks). It cannot be
  shared across vanilla and Astro sites and belongs in each site.

## Upstream

The token files were extracted from the marketing website's own token folder
on 2026-09-29. Until that site consumes this package, a token change there
needs mirroring here. The goal is for it to import `@exaforce/design-system`
and delete its copies, at which point this repo is the only source.

## Workflow

`npm run check` → edit → bump version → `npm run build` → `npm run serve` and
look at the styleguide in both themes → commit → push (CI tags it; Cloudflare
Pages builds `main` with `npm run build:pages`, which also republishes every
tagged release so exact paths survive).

## Hosting

Cloudflare Pages, Git integration, production branch `main`, build command
`npm run build:pages`, output `dist`, Node from `.node-version`. Live at
`https://exaforce-design-system.pages.dev`. README *Hosting* has the detail.
