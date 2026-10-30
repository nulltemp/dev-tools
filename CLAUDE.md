# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (Next.js + Turbopack) at http://localhost:3000
npm run build    # production build
npm run start    # serve the static export (out/) at http://localhost:4173 via vite preview
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
  2. add an entry (`href`, `name`, `description`) to the `tools` array in `src/app/tools.ts` — the sidebar nav (`layout.tsx`), the home page card grid (`page.tsx`), and `sitemap.xml` (`sitemap.ts`) are all generated from it
  3. add `src/app/<tool-name>/layout.tsx` that exports `metadata = toolMetadata("/<tool-name>")` (title, description, canonical, OGP/Twitter card) and renders `<JsonLd data={toolJsonLd("/<tool-name>")} />` before `children` (copy an existing tool's layout). Pages are client components, so they cannot export `metadata` themselves; the root layout applies the `%s | デベロッパーツール` title template)

- **SEO**: the site is a static export (`output: "export"` in `next.config.ts`), so `sitemap.ts` / `robots.ts` declare `dynamic = "force-static"`. `metadataBase` is set in the root layout from `SITE_URL` in `tools.ts`. A child `openGraph` replaces the parent's instead of merging, so `toolMetadata` repeats the shared fields including `images: [OG_IMAGE]` (`public/og.png`, a static PNG with an extension so static hosts serve the right Content-Type).

- **Analytics**: GA4 via `@next/third-parties` `GoogleAnalytics` in the root layout, rendered only when `NEXT_PUBLIC_GA_ID` is set. The ID lives in the committed `.env.production` (un-ignored in `.gitignore`), so only `next build` output includes the tag and `npm run dev` traffic is not tracked.
  Each tool page is a self-contained client component (`"use client"`) with its own local `useState`-based logic — there is no shared state, API layer, or data-fetching between tools.

- **Layout**: `src/app/layout.tsx` renders a 200px left sidebar (collapsing to a top nav at ≤768px) plus the single `<main>` content area. This is the single place shared chrome lives; tool pages must not render their own `<main>` (use `<div className="main">`) and should use `<h1 className="title">` for the page heading, with its text taken from `findTool("/<tool-name>").name` so it matches the nav. Give each input an `aria-label`, clear stale results/errors when the input changes, and use the shared `CopyButton` (`src/app/CopyButton.tsx`) for copyable output. The sidebar nav is the client component `SidebarNav.tsx` (marks the current page with `aria-current`).

- **Styling**: two systems coexist:
  - MUI (Material UI) is wired up via `ThemeProvider` + `AppRouterCacheProvider` (`@mui/material-nextjs`) in `layout.tsx`, with the theme defined in `src/app/theme.ts` (uses `cssVariables: true`, light/dark `colorSchemes` following `prefers-color-scheme`, and the `--font-sans` font stack). Use MUI components for new UI where practical.
  - Plain CSS utility classes (`.container`, `.main`, `.title`, `.cards`, `.card`, `.input-section`, `.input-field`, `.button-section`, `.error-message`, etc.) are defined globally in `src/app/globals.css` and reused across tool pages instead of per-page CSS modules. Reuse these existing classes for new tool pages rather than introducing new ad hoc styles, unless MUI components cover the need.
  - Theming uses CSS custom properties (`--primary`, `--background`, `--foreground`, etc.) in `globals.css` with a `prefers-color-scheme: dark` override block.

- **Fonts**: Roboto is loaded only via `next/font/google` (CSS variable `--font-roboto`, applied to `<html>`). `globals.css` defines `--font-sans` (Roboto + Japanese system font fallbacks, used by `body` and the MUI theme) and `--font-mono` (used by `.input-field` and `.formatted-json`).

- **Language**: UI copy is in Japanese.

## TypeScript

Path alias `@/*` maps to `src/*`. `strict` mode is enabled.
