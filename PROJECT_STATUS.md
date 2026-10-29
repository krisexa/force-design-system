# Project status and agent handoff

Audit date: 2026-10-19. Shared rules: [AGENTS.md](AGENTS.md).

## Current handoff

- Task (2026-10-29): bring the interactive Exabot from the playground artifact
  into the design system. User approved the recommended changes: hosted/bundled
  component instead of pasted snippets, full-spectrum Force only (other forms
  stay static SVGs), colours from tokens so light/dark/system work, safer
  defaults, playground in the styleguide. Consumers: primary site and Astro sites.
- Owner: Claude Code; released for handoff when this turn completes.
- Branch / base: `main`, `8830da2` (1.3.0). Working tree was clean on entry.
- Changes: new `src/exabot.js` (`<exa-bot>` ES module; fetches the existing
  full-spectrum Force SVG relative to itself or from a `src` attribute;
  `--exabot-*` custom properties fall back to semantic tokens then light
  literals; drag/pet on, peek/scroll opt-in via `enable`, sleep off by default;
  page listeners/timers only while a bot exists, pointer tracking per frame).
  New `src/site/exabot.html` playground (Customize / Export PNG, SVG, emoji
  zip / Embed for HTML and Astro). `scripts/build.mjs` publishes
  `<channel>/exabot.js` and `/exabot.html` (+ cache header); header nav link;
  package export `./exabot.js`, version `1.4.0`; root and avatar READMEs.
- Validation (Node 25.9.0, not 22): `npm run build` (incl. check), `npm test`
  (2 pass), `git diff --check` PASS. Headless Chrome: artwork mounts, unique
  IDs per instance, double import harmless, bubble/accent follow tokens in
  light and `data-theme=dark`, `--exabot-accent` override, literal fallback
  without tokens, events/methods, peek only when enabled, no console errors;
  playground light/dark/system screenshots, no overflow at 390 px, embed
  snippets, PNG/SVG/emoji-zip export. Fixed export breaking on the SVG's
  `inkscape:` attributes. exabot.js is 25 KB raw, ~8 KB gzip.
- Not run: real touch devices, manual keyboard/screen-reader pass, reduced
  motion in a browser (CSS rules reviewed only), Astro/Vite integration build,
  Existing dist/ was backed up to the session scratchpad.
- User authorized commit and push on 2026-10-29. Remote main matched the base
  and v1.4.0 was absent; `npm run build:pages` PASS with remote tag fetch and
  all historical channels 1.1.0–1.3.0. Next step: check CI/tag v1.4.0, verify
  `/v1/exabot.js` and `/exabot.html` on the host, then wire the primary site.

## Previous 1.3.0 handoff

- Task (2026-10-28): add the 24 supplied cool, soft-pastel and dark-spectrum
  Exabot SVGs. Owner: Codex; released for handoff. User authorized asset additions.
- Branch / base: `main`, `2a39f5926f16bb1ff6aabd5d5a57e561d468da3e`.
  Working tree was clean on entry; prior 1.2.0 additions were committed and pushed.
- Changes: three new directories under `src/assets/avatars/exabots/` with eight
  unchanged SVGs each; index expanded to 32 entries, keyed by form/colorway pair;
  avatar and root READMEs updated; package version bumped to `1.3.0` (additions).
  Existing full-spectrum SVGs and paths unchanged. No styleguide UI changes.
- Validation: `npm run build` (including invariants), `npm test` (2 tests),
  `git diff --check` PASS on Node 25.9.0. All 32 variants parse as XML, have
  unique form/colorway pairs, match supplied bytes, have valid internal IDs/
  references, contain no script/foreignObject/image or external hrefs, and match
  built v1 and 1.3.0 output. Existing ignored dist/ backed up before rebuilding.
- User authorized commit and push of 1.3.0 on 2026-10-28. Remote main matches
  the base and v1.3.0 is absent. `npm run build:pages` PASS with remote tag fetch,
  including historical 1.2.0 and 1.1.0–1.1.11. Prior 1.2.0 CI confirmed success.
- Publication: committing and pushing the reviewed 29 files in this turn;
  CI can tag v1.3.0 and Cloudflare can deploy main. Next step: check CI/tag and
  hosted variant availability after push. Total remains 32 avatars, without warm.
- Limits: Node 22 local and visual/browser checks not run. No dependency install.

## Previous full-spectrum handoff

- Task (2026-10-28): user authorized adding the eight supplied full-spectrum
  Exabot avatars for design-system usage. Owner: Codex; released for handoff.
- Branch / base: `main`, `e825eae65cf2c554d680daf17ba397bc61878e41`.
- Added `src/assets/avatars/exabots/`: eight unchanged SVGs, `index.json` and
  usage README. Root README includes hosted/bundler examples; LICENSE.md now
  explicitly covers Exabot brand artwork. No styleguide UI changes.
- Pre-existing work preserved: product-icon generator and generated assets,
  package.json version `1.2.0` and script, README product-icon documentation,
  LICENSE.md third-party note, and prior handoff below. The pending minor
  version already covers these additive assets; package.json was not changed
  during this task.
- Validation: `npm run check`, `npm test` (2 tests), `npm run build` and
  `git diff --check` PASS on Node 25.9.0. All eight SVGs parsed as XML, matched
  supplied originals byte for byte, contained no script/foreignObject/image or
  external hrefs, and matched output in both v1 and 1.2.0 channels.
- Existing ignored dist/ was backed up outside the repository before rebuilding.
  Node 22 and visual/browser checks were not run. No dependencies installed.
- User authorized committing and pushing the pending 1.2.0 release on 2026-10-28,
  including the existing product-icon additions. Remote main matches the base;
  v1.2.0 does not yet exist. `npm run build:pages` PASS with remote tag fetch
  and all historical 1.1.0–1.1.11 channels. Generator syntax check PASS.
- Publication: committing and pushing main in this turn; CI tags v1.2.0 after
  checks and the main push can trigger Cloudflare deployment. Next step: verify
  CI/tag and hosted avatar availability. Node 22 local/browser checks remain open.

## Previous product-icon handoff

- Task (2026-10-21): add the product icon library from the two product icon
  sheets ("Exaforce Icons", "Exaforce Graph Node Types and Icons") so marketing
  can rebuild product UI and graphs. Mappings/node types deliberately excluded.
- Owner: Claude Code; released for handoff when this turn completes.
- Branch / base: `main`, `e825eae` (= origin/main, tagged v1.1.11). Package
  bumped to `1.2.0` (minor: additions). Uncommitted; no commit/push authorized yet.
- Changes: new `scripts/product-icons.mjs` (+ `npm run product-icons`), new
  generated `src/assets/product-icons/` (1,944 SVGs + index.json, ~3.2 MB),
  README *Product icons* section and file tree, LICENSE.md third-party note,
  package.json version/script.
- Validation: `npm run check`, `npm run build`, `npm test` PASS (Node 25.9.0, not
  22). CSV and Sheets-JSON imports produce byte-identical output; partial export
  refused; all SVG ids prefixed per icon (no duplicate ids, no dangling refs).
  Headless Chrome contact sheet of every set eyeballed. No styleguide UI added.
- Sheet issues reported to the owner, first row kept: exf/workflow, app/rest,
  app/datadog, app/odoo, app/axonius reuse a name for different drawings;
  graph Network/PublicAddress and Network/Aggregation have conflicting colours.
- Next step: review, then commit/push only with explicit authorization (push
  tags v1.2.0 and deploys). Optional follow-up: searchable gallery in styleguide.
- Earlier handoff (Codex, 1.1.11 audit fixes) was published; its validation
  record follows.

## Fix validation (2026-10-19)

- `npm test`: PASS, 2 regression tests covering malformed URL recovery, 200/404/500,
  release-fetch failure preserving dist/, offline CI/Pages rejection, local offline
  build, successful fetch from a local fixture remote and immutable-tag rejection.
  Initial expanded test failed because it compared a manifest timestamp from before
  a second successful build; corrected the test snapshot, final run passed.
- `npm run build`: PASS, including invariant checks.
- `npm run build:pages` with network/filesystem permission: PASS, successful remote
  fetch; channels v1, 1.1.11 and every historical 1.1.0–1.1.10 included. Local tag
  inventory now includes v1.1.10; no remote refs were written.
- Live loopback HTTP smoke check on port 37943: PASS (styleguide, studio, CSS 200;
  missing path 404; malformed URL 400; subsequent home request 200). Temporary
  server stopped. Earlier sandbox/default-port startup attempts failed safely.
- Final syntax checks: PASS for scripts/theme and all 9 generated inline scripts;
  `git diff --check` PASS. Sample secret/local-setting paths confirmed ignored.
- CI action commit IDs verified against official repositories' v4 refs via
  `git ls-remote`. Remote workflow execution and account protections unverified.
- Runtime remains Node 25.9.0: no Node 22 binary found in checked standard locations,
  and no runtime/dependency installation performed. Node 22 validation remains open.

## Follow-up validation (2026-10-19)

User authorized running the next validation steps. Existing uncommitted work was
preserved; no implementation or account settings changed in this follow-up.

- `npm test`: PASS, 2 tests. `npm run build`: PASS, including invariants.
- `npm run build:pages`: PASS with real tag fetch; current 1.1.11 plus historical
  1.1.0–1.1.10 channels included. No push or deployment performed.
- Installed Chrome headless/CDP: 8 scenarios passed across styleguide and Ribbon
  Studio, widths 1280/375, light/dark system preferences with reduced motion.
  Documents completed loading, fonts loaded, no uncaught JS errors or horizontal
  overflow, no asset-unavailable fallback, and studio WebGL initialized.
  This was automated DOM/browser smoke coverage, not a visual, keyboard,
  screen-reader, contrast or export certification. Temporary server/profile stopped
  and cleaned up. HTTP recovery confirmed: missing 404, malformed 400, then home 200.
- Read-only GitHub checks succeeded: public repository, default main, not archived;
  last three check workflow runs succeeded. They cover committed revisions, not
  these uncommitted changes. Repository rulesets response was empty; main branch
  protection endpoint explicitly returned “Branch not protected”. Actions enabled,
  allowed actions set to all. Branch protection/required checks remain a priority
  account-setting recommendation; no account settings changed.
- Public hosting probes for manifest, floating CSS, 1.1.0 CSS and Ribbon Studio all
  returned HTTP 403. Cause unverified; deployment health, headers and production
  version cannot be established from these requests. Check Cloudflare access/build
  settings directly. No Cloudflare account configuration was inspected.
- Runtime remains Node 25.9.0. Checked Homebrew, nvm, mise and Volta standard install
  locations; no Node 22 found. No runtime or dependencies installed. Patched Node 22
  validation still needs a local runtime selection/install.
- Next concrete step: provision/select patched Node 22, rerun tests/build there;
  verify Cloudflare 403 and enable main protection/required checks with explicit
  account-setting approval. Then review changes for commit/push authorization.

## Findings disposition

- Fixed: release-fetch failure handling and preservation of previous output on
  preflight failure; preview URL/I/O/startup handling and loopback default; ignore
  rules; targeted tests and CI coverage; asset fallbacks; action pinning and default
  permissions; documented output estimates and Node 22 package requirement.
- Still open: actually selecting patched Node 22 on this machine, running browser/
  accessibility checks, and verifying GitHub/Cloudflare settings and production.
  No lint or type tooling added; built-in tests address the identified failure paths
  without dependencies. UI fallback behavior is syntax checked, not browser tested.

## Original audit observations (before fixes)

The sections below retain the initial audit evidence and historical recommendations;
use the current handoff and disposition above for present state.

## Verified current state

Plain CSS/HTML/browser JS, Node ESM build/check/preview scripts; no npm dependencies
or lockfile. No CMS integration. Source assets, fonts and token layers are separate;
shared header partials are injected into three HTML pages. Shader GLSL and renderer
are embedded in `src/site/ribbon-shader-studio.html`; only presets are separately
published. The large standalone studio is maintainable for current scope but has
no automated browser coverage; extraction is optional, not an audit prerequisite.

Local Git remote names `krisexa/force-design-system` on GitHub. Local tags are
`v1.1.0` through `v1.1.9`; current `v1.1.10` was not present locally. Latest local
commit is dated 2026-10-08, titled “1.1.10: no consuming sites, repos or local paths
named anywhere”. Prior local commits describe shared header and sidebar work;
commit subjects alone do not prove deployed behavior.

CI YAML runs on pushes and PRs: checks, release build, summary and artifact upload.
After a successful main push, a separate job can create/push the version tag with
`contents: write`. Actions use mutable major references (`@v4`). Hosting is described
as Cloudflare Pages Git integration, main production branch, `npm run build:pages`,
output `dist`, Node 22. No Wrangler config or server runtime was found. Static output
is compatible in structure; actual Cloudflare settings and deployment are unverified.

## Actual validation results

Executed with Node `v25.9.0`, npm `11.19.0`, rather than configured Node 22:

| Check | Result |
|---|---|
| Git status, branch, recent log, remote, tags, instruction inventory | Inspected; initial status clean; CLAUDE.md regular file, no instruction symlinks or nested instruction files found |
| `npm run check` | PASS: six categories, 632 tokens, 148 font files |
| `npm run build` | PASS, including prebuild invariant checks |
| `npm run build:pages` | PASS using local tags only; fetch warning: cannot open `.git/FETCH_HEAD`, operation not permitted |
| `node --check` for all four scripts and `src/theme.js` | PASS |
| Preview launch (`node scripts/serve.mjs`, same entry point as `npm run serve`) | FAILED: sandbox `listen EPERM` on port 3000; no HTTP or browser checks completed |
| `gh api repos/krisexa/force-design-system` and `gh run list` | FAILED: could not connect to api.github.com; no account/CI conclusions |
| Generated output measurement | 2,530 files, 128,139,321 bytes; largest file 9,589,900 bytes |
| Tests, lint, typecheck | Not configured; not passed by implication |

No package install or `npx` used. No npm advisory graph exists to audit; `npm audit`
was not run because there are no dependencies/lockfile. Public Node security and
release information was consulted; this is not an exhaustive advisory review of
Node or GitHub Actions. No automated secret scanner, browser, screen reader,
contrast tool, performance profiler, external host probe or deployment was run.
No full environment files or credentials were printed. Tracked environment/key
filename checks found none; no exhaustive Git history secret scan was performed.

## Original findings and proposed fixes (see disposition above)

No critical defect established in this limited audit. Severity reflects observed
risk, not a claim of exploitation.

| Severity | Finding / evidence | Proposed action |
|---|---|---|
| High (release integrity) | `build.mjs` catches tag-fetch failure and succeeds with local tags. CI checkout is shallow by default. A successful build can omit historical exact releases or miss the current-version immutability guard when its tag is unavailable. | Fail closed on release-tag fetch failure in CI/Pages; retain explicitly documented offline local mode. Verify main protections and deployment gates. |
| Medium | Preview URL decoding is outside error handling; malformed percent encoding can reject the async handler and terminate Node. Server binds without an explicit host and file reads conflate missing files with other I/O failures. Static inspection only. | Bind local preview to loopback by default, handle invalid URLs with 400, handle server errors and distinguish expected file misses. |
| Medium | `.gitignore` does not exclude `.env` or local credential/settings files. No tracked environment/key files found by filename checks. | Add scoped secret/local configuration ignores and review staged files; choose secret scanning proportional to the public repository. |
| Medium | Audit runtime 25 differs from configured 22; `engines >=20` accepts obsolete runtimes. Node 25 is EOL according to upstream release information. | Use current patched Node 22 locally; separately approve tightening engines if desired. Revalidate there. |
| Medium (coverage) | No dedicated unit/browser tests, linter or type checking; invariant checks cover limited CSS/font rules. Tag/release controls lack regression coverage. | First add focused tests for release-tag failure/immutability and preview malformed URLs. Propose tooling/dependencies before installing. |
| Low | SVG/preset fetches omit `response.ok` checks and often swallow errors; a failed asset may leave an empty section without diagnostics. | Add concise visible fallback and safe diagnostics for relevant asset failures. Local authored SVG insertion is not evidence of an untrusted-input vulnerability. |
| Low | CI actions use major tags; live workflow permissions and branch/ruleset protections unverified. | Consider action SHA pinning and explicit least permissions after account review. |
| Low | README font counts and hosting size estimates were stale (148 fonts, output about 128 MB observed). | Prefer measured counts; verify current Pages limits and projected release growth before release. |

## Accessibility, responsive design and performance

Static positives: viewport metadata, responsive CSS, semantic navigation, labeled
controls, theme support, base focus styles and reduced-motion rules. Studio reads
reduced-motion preference, caps animation to 30 FPS and pauses for hidden/offscreen
state. Fonts are subsetted and content-hashed; Japanese CSS is opt-in. These are
implementation observations, not accessibility or performance certification.

Manual checklist still open: light/dark/system rendering, narrow widths/zoom,
keyboard and visible focus, screen-reader names/status announcements, contrast,
WebGL unavailable/context failure, reduced-motion behavior, canvas focus/pan
alternatives, clipboard and PNG export, asset 404s, fonts and actual response headers.
No browser evidence justifies a claim these passed or failed.

## Manual account / hosting checks

1. In GitHub, verify repository visibility, default branch, recent workflow results,
   tag availability, rulesets/required checks and Actions token permissions. Network
   access blocked read-only CLI verification here; Git remote alone proves none of these.
2. In Cloudflare, verify Git connection, production branch, Node version, build/output
   settings, preview policy, deployment health, headers/CORS/cache and old exact paths.
   Confirm whether Pages waits for CI; separate integrations may deploy independently.
3. Confirm current hosting file/asset limits against the measured artifact. Check
   production `/manifest.json`, styleguide, shader studio and a historical release.
4. In VS Code, have each agent read AGENTS.md and PROJECT_STATUS.md explicitly when
   taking ownership. CLAUDE.md imports AGENTS.md. No extension/account settings were
   inspected or changed, and no shared private-memory setup is necessary.

## Decisions, history and open work

Preserve the dependency-free stack and existing token/font/release rules. Keep durable
instructions in AGENTS.md and concise live task state here. No major refactor is
needed for agent switching. Source/build changes need approval and release review;
documentation-only edits do not need a package version bump.

Earlier claims about token extraction, adopting sites, repository visibility changes
and migration incidents are historical notes inherited from documentation, not
independently verified current state. The old after-the-fact release approval advice
was replaced by explicit authorization before commit/push.

Outstanding work: Node 22 validation, browser checks and GitHub/Cloudflare
verification. Application fixes are recorded in the current handoff above.

## Handoff template for the next task

Replace Current handoff with: task and authorized scope; agent owner or released;
branch/base SHA; pre-existing work; changed files; exact commands/results and runtime;
unfinished work/blockers; next concrete step. Recheck Git on entry. Preserve unfinished
work in place when switching sequentially; concurrent work needs separate worktrees.

## External references consulted

- [Node release schedule](https://github.com/nodejs/Release#release-schedule)
- [Node EOL information](https://nodejs.org/en/about/eol)
- [Node security announcements](https://nodejs.org/en/blog/vulnerability/)
- [Official upload-artifact repository](https://github.com/actions/upload-artifact)
