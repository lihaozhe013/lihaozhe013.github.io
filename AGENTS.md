# Project Agent Instructions

## Version control

- Do not create a commit or push changes after every task by default.
- Keep completed changes in the working tree unless the user explicitly asks for
  a commit or push.
- Before every commit, run `pnpm exec prettier . --write` and then run the
  relevant validation checks. Generated lockfiles are excluded through
  `.prettierignore`.

## Design consistency

- Prefer shared layout, typography, and component tokens across all routes.
- Keep the first heading on About, Timeline, Contact, and future content pages
  on the shared `.page-title` scale used by Contact.
- Do not create page-specific visual variants when an existing shared style can
  express the intended hierarchy.
- Design all visual layouts for comfortable screen reading. Keep body copy to no
  more than 80 English characters or 40 Chinese characters per line where
  practical, using responsive content widths to prevent overly long lines.
- If a file exceeds 1,500 lines, assess whether it should be split and extract
  large standalone components into separate files where appropriate.

## Portfolio visual system

- Use the shared limestone palette in the CSS variables: `#E8E5DE` for the page,
  `#F3F0E9` for reading surfaces, `#D3CEC2` for image and component surfaces,
  `#292824` for primary text, `#625F58` for secondary text, and `#736553` for
  accents. Apply the same values to CSS, Mermaid, and WebGL.
- Keep Source Serif 4 and Source Han Serif SC for editorial type. Use restrained
  italic display text and a system sans-serif for navigation and labels.
- Keep the home cover asymmetric: name and introduction at left, an ink study at
  right, followed by one large featured project and two supporting text entries.
  Show the portrait on About and retain all project summaries in the Work index.
- Keep long-form reading surfaces calm and opaque. Limit English body copy to
  about 80 characters and Chinese body copy to about 40 characters per line.
- Keep brush and ambient motion inside the home artwork. Cap ambient updates at
  30fps, pause outside the visible artwork or while the document is hidden, and
  respect `prefers-reduced-motion`. Preserve a static image and lightweight
  canvas fallback.
- New project covers belong beside their project Markdown and use a consistent
  editorial material language of limestone, graphite, soft side light, and
  abstract sculptural form. Keep cover paths relative to the project folder.

## Project assets and images

- Project images live alongside their markdown files under
  `src/content/projects/<project-id>/assets/`. The markdown references them with
  relative paths like `assets/glb-editor-main.png`.
- At build time, Vite imports these images via `import.meta.glob` with `?url`,
  content-hashes them, and outputs all images into a flat `dist/assets/`
  directory. Different files produce different hashes, so name collisions across
  projects are safe. The resolver in `projectMarkdown.ts` maps each markdown
  file's relative image path to the correct hashed URL.
- When adding a new project with images, place them in
  `src/content/projects/<project-id>/assets/` and reference them as
  `assets/<filename>` in the markdown. No manual copying to `public/` is needed.

## Content and localization

- Read all concrete, user-facing content from JSON files; do not hardcode
  content in components or pages. This includes content that may grow in the
  future, such as project category labels, tags, navigation items, metadata, and
  list entries.
- Treat the English `translation.json` as the source of truth when checking
  content completeness. Only the English translation file needs to be checked;
  Chinese translations do not require completeness or parity checks.
