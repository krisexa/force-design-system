# force-design-system

Exaforce's marketing design system: tokens, typefaces, brand assets, theme
script. Consumed by the website (Astro), an internal site and the campaign
pages (vanilla HTML). README.md has the consumer-facing docs; this file is for
working on the repo itself.

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
  is cached immutable. Bump `version` in package.json.
- Do not declare the bare family names `Inter Tight` or `Google Sans Flex`.
  Only `… Variable` and `… Fallback`. See the note at the top of fonts.css.
- Do not add site-specific CSS (buttons, cards, page blocks). It cannot be
  shared across vanilla and Astro sites and belongs in each site.

## Upstream

The token files were extracted from
`the website's token folder` on 2026-09-29. Until
that site consumes this package, a token change there needs mirroring here.
The goal is for that site to import `@exaforce/design-system` and delete its
copies, at which point this repo is the only source.

## Workflow

`npm run check` → edit → bump version → `npm run build` → `npm run serve` and
look at the styleguide in both themes → commit.
