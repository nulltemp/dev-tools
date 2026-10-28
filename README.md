# dev-tools

小さな独立したデベロッパー向けユーティリティツール集です。Next.js (App Router) 製で、以下のURLに公開されています。

https://dev-tools.nulltemp.com

## 現在のツール

- 文字数カウンター (`/char-count`) — テキストの文字数をカウントします
- JSON整形 (`/json-formatter`) — JSONデータを整形して表示します
- JWTデコーダー (`/jwt-decoder`) — JWTのヘッダーとペイロードをデコードして表示します（署名の検証は行いません）

## Getting Started

パッケージマネージャーは npm を使用しています。

```bash
npm install
npm run dev      # 開発サーバー起動 (Next.js + Turbopack) http://localhost:3000
npm run build    # 本番ビルド
npm run start    # 本番ビルド (out/) を http://localhost:4173 で配信
npm run lint     # ESLint (eslint .)
npm test         # テスト実行 (Vitest)
```

テストは Vitest で、各ツールのロジック（`src/app/<tool-name>/*.ts`）の隣に `*.test.ts` として置いています。

## ツールの追加方法

1. `src/app/<tool-name>/page.tsx` に新しいルートを作成する
2. `src/app/tools.ts` の `tools` 配列にツール（`href`・`name`・`description`）を追加する（サイドバー・ホームのカード・サイトマップはここから自動生成されます）
3. `src/app/<tool-name>/layout.tsx` を作成し、`export const metadata = toolMetadata("/<tool-name>");` でタイトル・canonical・OGPを設定し、`<JsonLd data={toolJsonLd("/<tool-name>")} />` で構造化データを出力する（既存ツールの `layout.tsx` を参照）

各ツールページは `"use client"` の自己完結したコンポーネントで、独自の `useState` ベースのロジックのみを持ちます（ツール間の共有状態・APIレイヤー・データフェッチはありません）。

スタイリングは MUI (Material UI) と `src/app/globals.css` のユーティリティクラス（`.container`, `.cards`, `.card`, `.input-section` など）を併用しています。既存のクラスがあれば新規CSSを追加せず再利用してください。

詳細なアーキテクチャ方針は [CLAUDE.md](./CLAUDE.md) を参照してください。
