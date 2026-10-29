# Exabot avatars

32 original SVGs (eight forms in four colorways), supplied with the October 2026 Exabot
Creation Guide. Each has a 512 × 512 viewBox, a transparent surrounding canvas,
native gradients and an opaque tinted white face. `index.json` lists all files;
paths in the index are relative to this folder. Each variant is identified by
its `id` (form) and `colorway` together; form IDs repeat across colorways.

| Colorway directory | Force example |
|---|---|
| `full-spectrum/` | [Full spectrum](full-spectrum/exabot-force-full-spectrum.svg) |
| `cool/` | [Cool](cool/exabot-force-cool.svg) |
| `soft-pastel/` | [Soft pastel](soft-pastel/exabot-force-soft-pastel.svg) |
| `dark-spectrum/` | [Dark spectrum](dark-spectrum/exabot-force-dark-spectrum.svg) |

Every directory contains all eight forms below. To select a variant, use
`<colorway>/exabot-<form>-<colorway>.svg`. The full-spectrum paths remain unchanged.

| Form | SVG |
|---|---|
| Force | [force](full-spectrum/exabot-force-full-spectrum.svg) |
| Lightning bolt | [lightning-bolt](full-spectrum/exabot-lightning-bolt-full-spectrum.svg) |
| Long pill | [long-pill](full-spectrum/exabot-long-pill-full-spectrum.svg) |
| Magnifying glass | [magnifying-glass](full-spectrum/exabot-magnifying-glass-full-spectrum.svg) |
| Shield | [shield](full-spectrum/exabot-shield-full-spectrum.svg) |
| Spark | [spark](full-spectrum/exabot-spark-full-spectrum.svg) |
| Square | [square](full-spectrum/exabot-square-full-spectrum.svg) |
| Triangle | [triangle](full-spectrum/exabot-triangle-full-spectrum.svg) |

## Usage

Use the SVG as an image at equal width and height; preserve its full viewBox
and proportions. Image embedding isolates gradient and mask IDs. If inlining
multiple copies of the same avatar, give each copy unique IDs and update all
references, including `aria-labelledby`, to avoid collisions.

The supplied guide specifies:

- Prefer 48 px or larger; review 32 px at its final display size.
- Leave clear space equal to at least 1/8 of the visible body width.
- Use the original colorway on either light or dark surfaces. Keep the face
  opaque and retain the dark eyes, proportions and spacing.
- Grayscale is reserved for unavailable actions and uses separate disabled
  artwork with an exclamation mark and a clear label such as “Unavailable”.
  Disabled artwork is not included in this set; do not simulate it with a filter.

Full spectrum, cool, soft pastel and dark spectrum are included. Warm and
separate disabled artwork are not included. Colorways are selected explicitly;
dark spectrum does not switch automatically with the page theme. These are
fixed brand artwork, not theme tokens; do not recolor them through CSS.

The interactive `<exa-bot>` component (`src/exabot.js`, playground at
`/exabot.html`) animates the full-spectrum Force SVG from this folder. It is
the only interactive form; see *Interactive Exabot* in the root README.

Provide meaningful image alt text when the avatar conveys identity. Use empty
alt text when decorative or when the same identity is already labeled nearby.

Exaforce brand assets are all rights reserved; see the repository LICENSE.md.
