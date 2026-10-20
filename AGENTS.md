# Shared development instructions

Read this file, [README.md](README.md), and [PROJECT_STATUS.md](PROJECT_STATUS.md)
before editing. These rules apply to Claude Code and Codex. Follow any deeper
package instructions in their scope. No nested agent instructions or instruction
symlinks were found in the 2026-10-19 audit; check again when starting work.

This public repository contains Exaforce marketing tokens, fonts, brand assets,
theme script and a static styleguide / Ribbon Shader Studio. Do not name consuming
sites, their repositories or local paths in shared files.

## Working safely

- Inspect branch, HEAD, status and diffs first, including untracked files. Preserve
  all existing work. Never reset, stash, discard or overwrite it to switch agents.
- One agent owns a working tree at a time. Stop the outgoing agent before switching.
  Concurrent agents need separate worktrees and branches; coordinate shared files.
- Keep changes narrow and follow nearby formatting: plain CSS, HTML and JavaScript,
  Node ESM scripts, no framework or dependency installation without authorization.
- Never put secrets, full environment files, machine settings or authenticated
  request/error objects in output or shared documentation. Local secrets/settings are ignored; still inspect staged filenames before any
  authorized commit.
- Application, dependency, CI, infrastructure, security-setting and deployment
  changes require explicit approval under the current workflow. Documentation-only
  improvements may proceed. Never commit, push, merge, deploy or publish CMS content
  without authorization. A main-branch push can tag a release and trigger production
  deployment; inspect actual effects before acting. No CMS integration exists here.
- Edit source, not generated `dist/`. Builds delete and recreate `dist/`; preserve
  any manually modified output before running them. `npm run logos` rewrites SVGs.

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

## Validation and releases

Use the commands in README's Local section. `npm run check` checks specific token,
font and theme invariants; it is not a test suite, linter or type checker.
`npm run build` includes the check. `npm run build:pages` additionally attempts a
remote tag fetch and executes historical build scripts from local/fetched tags.
Release builds fail on tag-fetch errors before replacing output. Explicit local
`--releases --offline-releases` mode is forbidden in CI/Pages; its output must not
be deployed. Run `npm test` for release and preview regression checks.

Use Node 22 from `.node-version`, preferably a supported patched release. No npm
install is needed. Do not use npx to install missing validators implicitly.
For UI changes manually inspect light/dark/system themes, narrow widths, keyboard
access, reduced motion, resource failures and relevant shader/export behavior.
Do not claim browser, accessibility, CI or deployment checks passed unless run.
Documentation-only changes do not require a version bump. Source or build-output
changes need release review and the immutable-version rules above.

## Handoff

Before switching agents, update PROJECT_STATUS.md with task, owner/released state,
branch, base commit, changed files (including pre-existing work), actual validation
results, unfinished work and next concrete step. Record blockers and approved scope.
The incoming agent rechecks Git and reads that file; private memory and chat history
are not the handoff. Durable rules belong here, current task state belongs there.
