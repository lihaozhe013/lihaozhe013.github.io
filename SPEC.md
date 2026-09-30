# Editorial Portfolio

## Direction

Present the portfolio as a quiet personal journal: limestone paper, ink-colored
type, delicate rules, broad margins, matte image surfaces, and a restrained use
of technology. The home page uses an asymmetric introduction with an ink study
alongside the owner's name. The portrait remains on About.

## Shared visual system

- Page surface: `#E8E5DE`.
- Reading surface: `#F3F0E9`.
- Image and raised component surface: `#D3CEC2`.
- Primary text: `#292824`.
- Secondary text: `#625F58`.
- Accent: `#736553`.
- Use one-pixel rules, square image corners, and generous responsive spacing.
- Use Source Serif 4 and Source Han Serif SC for editorial type; use the system
  sans-serif for navigation and supporting labels.
- Share the `.page-title` scale across About, Work, Contact, and future pages.
  Keep body text near 80 English characters or 40 Chinese characters per line.
- Read visible content, labels, and image captions from the locale JSON files.

## Page layouts

- Navigation places the full name at left and Work, About, Contact, and locale
  switching at right. Work links to the existing `/timeline` route.
- Home places a two-line name, identity, introduction, and links at left. A
  dedicated ink artwork sits at right with a translated caption. Selected work
  retains project numbering: AIO Asset Normalizer is the large visual feature;
  TradeFlow and Docmost are supporting text entries. Clicking artwork or a title
  opens the existing preview dialog. A separate details link goes to the full
  project page. The page closes with the existing personal introduction and a
  shared contact footer.
- About pairs the grayscale portrait and introduction, followed by text-based
  skills and education. On narrow screens it orders the title, image,
  introduction, skills, and education vertically.
- Work retains every project in number order as a directory with the preview
  dialog and direct detail links.
- Contact ends with the existing invitation and social links.
- Project details use a calm reading surface, a narrow text measure, and wider
  media and diagram regions. Adapt dialogs, code blocks, tables, Mermaid
  controls, and buttons to the same light palette. Keep source screenshots in
  their original color.

## Artwork and interaction

- The home ink study and AIO abstract stone cover are the two authored raster
  assets for this iteration. Keep the home image in `src/assets/` and the cover
  beside its project Markdown under `assets/`. Store cover paths in
  `ProjectMeta` as relative asset paths; store cover alt text and captions in
  locale JSON.
- The local home artwork uses the existing WebGL fluid renderer over a
  persistent static image. Sample the image in the composite shader and layer
  stable fine grain, a subtle light drift, and graphite brush pigment over it.
- Keep the brush sampling, speed response, diffusion, and decay inside the art
  frame. Update the ambient shader at no more than 30fps and run fluid passes
  only while ink is active or dispersing.
- Stop ambient motion when the artwork leaves the viewport, the document is
  hidden, or reduced motion is enabled. Touch-first devices use a static image
  and light canvas tap response. Keep all motion within the artwork frame.
- Keep the image visible when WebGL setup fails or the context is lost; use the
  2D canvas as a light feedback fallback.

## Acceptance

- Keep the home, About, Work, Contact, detail, and dialog layouts within the
  shared design system at 1440px, 1024px, 390px, and 320px.
- English and Chinese headings, navigation, and project rows fit without
  horizontal overflow.
- Maintain at least 4.5:1 contrast for ordinary text.
- Preserve route behavior, project numbering and facts, previews, keyboard
  focus, Escape handling, focus restoration, direct detail navigation, browser
  history, code copying, Mermaid zoom, and original screenshot colors.
- Check pointer painting and decay, artwork visibility pause, document
  visibility pause, reduced motion, and WebGL fallback.
- Run TypeScript, production build, and formatting checks. Leave completed
  changes in the working tree; do not commit or push unless requested.

## Future project covers

Future covers should use a consistent abstract material image system based on
limestone, graphite, and soft side light. The current single AIO cover is an
intentional feature of this editorial home composition; do not introduce empty
cover placeholders for other projects.
