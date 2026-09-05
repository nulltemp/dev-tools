# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (Next.js + Turbopack) at http://localhost:3000
npm run build    # production build
npm run start    # run production build
npm run lint     # next lint (flat config: next/core-web-vitals + next/typescript)
```

There is no test suite configured in this project. Package manager is npm (package-lock.json is present).

## Architecture

This is a Next.js (App Router) collection of small, independent developer utility tools ("デベロッパーツール"), deployed at https://dev-tools-lovat.vercel.app/. Currently available tools: 文字数カウンター (`src/app/char-count`) and JSON整形 (`src/app/json-formatter`).

- **Adding a new tool**: create a new route directory under `src/app/<tool-name>/page.tsx`, then add a link/card for it in two places:
  - the sidebar nav in `src/app/layout.tsx` (the `<nav>` list)
  - the home page card grid in `src/app/page.tsx`
  Each tool page is a self-contained client component (`"use client"`) with its own local `useState`-based logic — there is no shared state, API layer, or data-fetching between tools.

- **Layout**: `src/app/layout.tsx` renders a fixed-width (200px) left sidebar with tool links plus a `<main>` content area. This is the single place shared chrome lives; individual tool pages only render their own content assuming they're inside that shell.

- **Styling**: two systems coexist:
  - MUI (Material UI) is wired up via `ThemeProvider` + `AppRouterCacheProvider` (`@mui/material-nextjs`) in `layout.tsx`, with the theme defined in `src/app/theme.ts` (uses `cssVariables: true` and the Roboto font CSS variable). Use MUI components for new UI where practical.
  - Plain CSS utility classes (`.container`, `.main`, `.title`, `.cards`, `.card`, `.input-section`, `.input-field`, `.button-section`, `.error-message`, etc.) are defined globally in `src/app/globals.css` and reused across tool pages instead of per-page CSS modules. Reuse these existing classes for new tool pages rather than introducing new ad hoc styles, unless MUI components cover the need.
  - Theming uses CSS custom properties (`--primary`, `--background`, `--foreground`, etc.) in `globals.css` with a `prefers-color-scheme: dark` override block.

- **Fonts**: Roboto is loaded both via `next/font/google` (as a CSS variable `--font-roboto`, applied to `<html>`) and via `@fontsource/roboto` static imports in `layout.tsx`.

- **Language**: UI copy is in Japanese.

## TypeScript

Path alias `@/*` maps to `src/*`. `strict` mode is enabled.
