# Charcoal Grain and Ink Portfolio Theme

## Intent

Give the portfolio the monochrome, editorial cover treatment of the supplied
references: charcoal surfaces, large serif type, defocused light, fine grain,
delicate rules, and broad negative space. Keep the existing project and page
content, bilingual navigation, and brush interaction.

## Shared visual system

- Use `#262626` for the main surface, `#222222` for reading surfaces, and
  `#303030` for raised components.
- Use `#F2F2F0` for primary text, `#B8B8B5` for secondary text, and translucent
  white for the one-pixel rules and restrained hover fills.
- Keep Source Serif 4 and Source Han Serif SC for English and Chinese.
- Keep content widths at or below approximately 80 English characters and 40
  Chinese characters per line. Keep the shared `.page-title` at
  `clamp(2rem, 4.6vw, 5rem)`.
- Read all new visible copy from the existing locale JSON files. Do not add
  project-cover data fields in this iteration.

## Pages

- Home: set the owner's name in large serif type within a cover about 80svh
  tall. Keep existing identity copy and links with the title; move the portrait
  to About. Display selected projects as three full-width text rows ordered by
  their existing project index.
- About: pair the grayscale portrait with the existing introduction, resume
  links, and short personal note. Follow with the existing skills and education.
- Timeline: preserve the complete ordered project archive and its preview
  dialogs. Use the same typography, lines, and grayscale hover treatment as
  Home.
- Contact: use the current invitation and social links in a spacious closing
  layout.
- Project details and dialogs: use stable dark reading surfaces. Style Mermaid,
  tables, inline code, code blocks, controls, and borders for the grayscale
  theme. Preserve project screenshots at their original color.

## WebGL environment and brush

- Use the existing WebGL renderer and canvas. Draw the background as a stable
  monochrome base with three broad, soft light shapes and pixel-coordinate
  grain. Keep grain stationary so it does not shimmer between frames.
- Animate the home-cover light shapes slowly at up to 30fps while the cover is
  visible. Let pointer movement and active ink velocity subtly distort nearby
  light and grain. Keep interior page environments still between interactions.
- Separate the environment render from the fluid solver. Render the background
  on ambient cover frames without running fluid passes. Run the existing fluid
  simulation while ink is being deposited and disperses, and preserve its
  current pointer speed response, sampling, and fading behavior.
- Render ink in grayscale from soft silver wet edges to charcoal cores. Use the
  same monochrome palette for the trailing particles.
- On touch-first screens, keep the ambient environment still and preserve the
  light tap response. Honor changes to `prefers-reduced-motion`, pause when the
  document is hidden, and stop home-cover movement after that section leaves the
  viewport.
- If WebGL setup fails or its context is lost, retain the charcoal CSS gradient,
  a static grain layer, and the existing 2D interaction fallback.

## Future project covers

Project covers are out of scope for this iteration. Do not create cover images,
empty cover frames, or metadata placeholders. When introduced, every project
cover should use the same abstract, monochrome, defocused light-and-shadow
language and preserve a consistent treatment across the portfolio.

## Acceptance

- The home cover, text project rows, About portrait, project archive, contact
  page, dialogs, and project details all follow the shared grayscale design.
- English and Chinese layouts remain readable at 320px and 390px widths; tablet
  and desktop layouts are checked at 1024px and 1440px without horizontal
  overflow.
- Ordinary text has at least 4.5:1 contrast against the darkest content surface.
- The home ambient shader remains distinct from the fluid solver, stops outside
  the visible cover, and never animates while reduced motion is enabled.
- Slow and fast brush movement, ink fading, touch feedback, route changes,
  document visibility, WebGL fallback, keyboard-operated project dialogs, image
  loading, code copying, and Mermaid zoom controls continue to work.
- TypeScript, production build, and formatting checks pass. Keep changes in the
  working tree; do not create a commit or push by default.
