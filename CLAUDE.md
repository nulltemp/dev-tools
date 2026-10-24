# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (Next.js + Turbopack) at http://localhost:3000
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint . (flat config: eslint-config-next core-web-vitals + typescript)
npm test         # run unit tests once (Vitest)
npm run test:watch  # Vitest in watch mode
npx vitest run src/app/jwt-decoder  # run tests under one path
```

Tests use Vitest (`vitest.config.mts`, node environment) and live next to the code as `src/**/*.test.ts`. Tool pages keep UI only; pure logic is extracted into a sibling module (e.g. `jwt-decoder/decodeJwt.ts`) and unit-tested there — follow this for new tools. Package manager is npm (package-lock.json is present).

## Architecture

This is a Next.js (App Router) collection of small, independent developer utility tools ("デベロッパーツール"), deployed at https://dev-tools.nulltemp.com. Currently available tools: 文字数カウンター (`src/app/char-count`), JSON整形 (`src/app/json-formatter`), and JWTデコーダー (`src/app/jwt-decoder`).

- **Adding a new tool**:
  1. create `src/app/<tool-name>/page.tsx` (client component)
  2. add an entry (`href`, `name`, `description`) to the `tools` array in `src/app/tools.ts` — the sidebar nav (`layout.tsx`) and the home page card grid (`page.tsx`) are both generated from it
  3. add `src/app/<tool-name>/layout.tsx` that exports `metadata = toolMetadata("/<tool-name>")` (pages are client components, so they cannot export `metadata` themselves; the root layout applies the `%s | デベロッパーツール` title template)
  Each tool page is a self-contained client component (`"use client"`) with its own local `useState`-based logic — there is no shared state, API layer, or data-fetching between tools.

- **Layout**: `src/app/layout.tsx` renders a 200px left sidebar (collapsing to a top nav at ≤768px) plus the single `<main>` content area. This is the single place shared chrome lives; tool pages must not render their own `<main>` (use `<div className="main">`) and should use `<h1 className="title">` for the page heading.

- **Styling**: two systems coexist:
  - MUI (Material UI) is wired up via `ThemeProvider` + `AppRouterCacheProvider` (`@mui/material-nextjs`) in `layout.tsx`, with the theme defined in `src/app/theme.ts` (uses `cssVariables: true`, light/dark `colorSchemes` following `prefers-color-scheme`, and the `--font-sans` font stack). Use MUI components for new UI where practical.
  - Plain CSS utility classes (`.container`, `.main`, `.title`, `.cards`, `.card`, `.input-section`, `.input-field`, `.button-section`, `.error-message`, etc.) are defined globally in `src/app/globals.css` and reused across tool pages instead of per-page CSS modules. Reuse these existing classes for new tool pages rather than introducing new ad hoc styles, unless MUI components cover the need.
  - Theming uses CSS custom properties (`--primary`, `--background`, `--foreground`, etc.) in `globals.css` with a `prefers-color-scheme: dark` override block.

- **Fonts**: Roboto is loaded only via `next/font/google` (CSS variable `--font-roboto`, applied to `<html>`). `globals.css` defines `--font-sans` (Roboto + Japanese system font fallbacks, used by `body` and the MUI theme) and `--font-mono` (used by `.input-field` and `.formatted-json`).

- **Language**: UI copy is in Japanese.

## TypeScript

Path alias `@/*` maps to `src/*`. `strict` mode is enabled.
