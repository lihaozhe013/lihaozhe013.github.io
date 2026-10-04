# Haozhe Li — Portfolio

An editorial-style React portfolio built with Vite, Tailwind CSS, Radix Dialog,
React Router, and i18next.

## Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

## Content and translations

Stable project metadata lives in `src/data/portfolio.json`. User-facing copy
lives in the locale JSON files:

- `src/locales/en/translation.json`
- `src/locales/zh/translation.json`

The TypeScript files under `src/types` and `src/data/portfolio.ts` only define
and validate the data shape. They do not contain portfolio copy.

The site routes are `/`, `/timeline`, `/about`, `/contact`, and
`/projects/:projectId`. Shared navigation, language switching, and the ink
canvas live in `src/components/AppLayout.tsx`.

Projects with long-form case studies can opt into a detail route at
`/projects/:projectId`. Add a Markdown filename to the project's `markdown`
field in `src/data/portfolio.json`, then create the matching file under
`src/content/projects/`. Markdown images can use `assets/example.png`; place
those files beside the project Markdown under
`src/content/projects/<project-id>/assets/`. The asset resolver imports them
through Vite, so no manual copy to `public/` is required.

The local Source Han Serif SC web subset is generated from the current JSON
content and stored under `src/assets/fonts/SourceHanSerifSC/Web`. If new Chinese
characters are added to the content, regenerate the subset before building the
site.

## Project case studies

The current software case studies cover AIO Asset Normalizer, TradeFlow, Geared
Term, Augur Git, and StreamFile Server. Their summaries, highlights, technology
lists, and detail pages describe the local implementations:

| Portfolio entry      | Local repository              | Implementation references                                         |
| -------------------- | ----------------------------- | ----------------------------------------------------------------- |
| AIO Asset Normalizer | `../aio-asset-normalizer`     | `src/modules/operations/`, GLB and BVH modules, CLI entry points  |
| TradeFlow            | `../tradeflow-core`           | Inventory and FIFO services, `backend/mcp/`, `desktop/core/`      |
| Geared Term          | `../geared-term`              | Main-process terminal, vault, persistence, and AI services        |
| Augur Git            | `../augur-git`                | Active `tauri-app/` bridge, Git worker, and prompt generation     |
| StreamFile Server    | `../streamfile-server-nodejs` | Backend file access, uploads, subtitles, and embedded asset build |

Keep current capabilities distinct from roadmap items and legacy versions.
Earlier engineering entries without a corresponding local checkout retain their
existing descriptions. Repository links identify the projects; content updates
do not require discovering additional projects online.

Validate content changes with `pnpm exec tsc --noEmit`, `pnpm build`, and a
browser check of detail routes and Mermaid diagrams. Check English titles,
summaries, highlights, Markdown paths, and cover references for each entry.
