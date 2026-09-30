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

- Keep the portfolio's default theme in a restrained charcoal and grayscale
  palette. Treat the CSS variables in `src/index.css` as the shared source for
  page surfaces, text, borders, Mermaid diagrams, and the WebGL shader palette.
- Keep the animated background behind readable content. Use stronger grain and
  slow light movement on the home cover, then reduce both through the project
  archive and long-form reading surfaces. Preserve a static fallback and respect
  `prefers-reduced-motion`.
- Keep the home cover centered on the owner's name. Show the portrait on About,
  with project summaries in the home page's text index.
- When project covers are introduced, use one consistent monochrome system of
  abstract, defocused light and shadow across every project. Keep covers out of
  the project data and page layout until that system is implemented as a whole.

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
