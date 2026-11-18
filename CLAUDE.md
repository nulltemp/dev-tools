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
npm run test:e2e # Playwright E2E tests against the static export (run npm run build first)
npx playwright test e2e/tools.spec.ts -g "UUID"  # run some E2E tests
```

Tests use Vitest (`vitest.config.mts`, node environment) and live next to the code as `src/**/*.test.ts`. Tool pages keep UI only; pure logic is extracted into a sibling module (e.g. `jwt-decoder/decodeJwt.ts`) and unit-tested there — follow this for new tools. Package manager is npm (package-lock.json is present).

E2E tests (Playwright, `playwright.config.ts`) live in `e2e/` and run against `out/` served by `npm run start`, on a desktop and a mobile (Pixel 7) project, with `Asia/Tokyo` timezone. Import `test`/`expect` from `e2e/fixtures.ts`, not `@playwright/test`: its fixtures abort and record every non-localhost request (so CI never sends GA hits; `externalRequests` lets a test assert nothing was sent) and fail the test on any page error. It also has helpers: `openNav` (opens the mobile menu when needed), `resultBlock` (a `CodeBlock` by title), `definition` (a value in a `<dl>` result), `errorAlert`. When adding a tool, add its main flow to `e2e/tools.spec.ts`; `e2e/site.spec.ts` already covers nav, headings and horizontal overflow for every entry in `tools.ts`. `@playwright/test` is pinned to an exact version so it matches the installed browser. CI runs lint, unit tests, build, then E2E.

## Architecture

This is a Next.js (App Router) collection of small, independent developer utility tools ("デベロッパーツール"), deployed at https://dev-tools.nulltemp.com. Currently available tools: 文字数カウンター (`src/app/char-count`), JSON整形 (`src/app/json-formatter`), JWTデコーダー (`src/app/jwt-decoder`), Unixタイムスタンプ変換 (`src/app/unix-timestamp`), Base64エンコード・デコード (`src/app/base64`), URLエンコード・デコード (`src/app/url-encode`), and UUID生成 (`src/app/uuid`).

- **Adding a new tool**:
  1. create `src/app/<tool-name>/page.tsx` (client component)
  2. add an entry (`href`, `name`, `description`) to the `tools` array in `src/app/tools.ts` — the sidebar nav (`layout.tsx`), the home page card grid (`page.tsx`), and `sitemap.xml` (`sitemap.ts`) are all generated from it
  3. add `src/app/<tool-name>/layout.tsx` that exports `metadata = toolMetadata("/<tool-name>")` (title, description, canonical, OGP/Twitter card) and renders `<JsonLd data={toolJsonLd("/<tool-name>")} />` before `children` (copy an existing tool's layout). Pages are client components, so they cannot export `metadata` themselves; the root layout applies the `%s | デベロッパーツール` title template)

- **SEO**: the site is a static export (`output: "export"` in `next.config.ts`), so `sitemap.ts` / `robots.ts` declare `dynamic = "force-static"`. `metadataBase` is set in the root layout from `SITE_URL` in `tools.ts`. A child `openGraph` replaces the parent's instead of merging, so `toolMetadata` repeats the shared fields including `images: [OG_IMAGE]` (`public/og.png`, a static PNG with an extension so static hosts serve the right Content-Type).

- **Analytics**: GA4 via `@next/third-parties` `GoogleAnalytics` in the root layout, rendered only when `NEXT_PUBLIC_GA_ID` is set. The ID lives in the committed `.env.production` (un-ignored in `.gitignore`), so only `next build` output includes the tag and `npm run dev` traffic is not tracked.
  Each tool page is a self-contained client component (`"use client"`) with its own local `useState`-based logic — there is no shared state, API layer, or data-fetching between tools.

- **Layout**: `src/app/layout.tsx` wraps everything in MUI's `ThemeProvider` + `CssBaseline` and the client component `AppShell.tsx`, which renders a permanent 240px drawer (sidebar nav, `aria-current` on the current page) at `md` and up, and an `AppBar` with a menu button opening a temporary drawer below `md`, plus the single `<main>`. This is the single place shared chrome lives; tool pages must not render their own `<main>`. Wrap each tool page in `ToolPage` (`src/app/ToolPage.tsx`, renders the `<h1>` and description, max width 960px) and pass `findTool("/<tool-name>")`'s `name` and `description` so the heading matches the nav. Give each input an `aria-label` (`slotProps={{ htmlInput: { "aria-label": ... } }}` on `TextField`), clear stale results/errors when the input changes, and use the shared `CopyButton` (`src/app/CopyButton.tsx`) for copyable output and `CodeBlock` (`src/app/CodeBlock.tsx`) for titled preformatted output such as JSON. Two-way text converters (encode/decode) can reuse `EncodeDecodeTool` (`src/app/EncodeDecodeTool.tsx`), as `base64` and `url-encode` do.

- **Styling**: MUI (Material UI) only. The theme is `src/app/theme.ts` (`cssVariables` with `colorSchemeSelector: "media"`, so light/dark `colorSchemes` follow `prefers-color-scheme`; palette, shape, typography and component defaults live here). `MuiButtonBase`'s `LinkComponent` is Next's `Link`, so `<Button href>` / `<CardActionArea href>` work even from server components (which cannot pass `component={Link}`). Style with MUI components and the `sx` prop using theme tokens (`text.secondary`, `divider`, `primary.main`, ...); do not add global CSS classes. MUI is v9, which removed system props: put style values such as `color: "text.secondary"`, `mt`, `fontWeight` in `sx`, not as props on `Typography`/`Box`/`Stack` (`color="text.secondary"` as a prop silently does nothing). `globals.css` only defines the font variables. Use `monoInput` (`src/app/inputStyles.ts`) as a `TextField`'s `sx` for code/data inputs; icons come from `@mui/icons-material`.

- **Fonts**: Roboto is loaded only via `next/font/google` (CSS variable `--font-roboto`, applied to `<html>`). `globals.css` defines `--font-sans` (Roboto + Japanese system font fallbacks, used by `body` and the MUI theme) and `--font-mono` (used for code/data inputs and output).

- **Language**: UI copy is in Japanese.

## TypeScript

Path alias `@/*` maps to `src/*`. `strict` mode is enabled.
