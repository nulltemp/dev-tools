# dev-tools

小さな独立したデベロッパー向けユーティリティツール集です。Next.js (App Router) 製で、以下のURLに公開されています。

https://dev-tools-lovat.vercel.app/

## 現在のツール

- 文字数カウンター (`/char-count`) — テキストの文字数をカウントします
- JSON整形 (`/json-formatter`) — JSONデータを整形して表示します

## Getting Started

パッケージマネージャーは npm を使用しています。

```bash
npm install
npm run dev      # 開発サーバー起動 (Next.js + Turbopack) http://localhost:3000
npm run build    # 本番ビルド
npm run start    # 本番ビルドの起動
npm run lint     # next lint
```

テストスイートは未設定です。

## ツールの追加方法

1. `src/app/<tool-name>/page.tsx` に新しいルートを作成する
2. `src/app/layout.tsx` のサイドバーナビにリンクを追加する
3. `src/app/page.tsx` のホームページのカード一覧にリンクを追加する

各ツールページは `"use client"` の自己完結したコンポーネントで、独自の `useState` ベースのロジックのみを持ちます（ツール間の共有状態・APIレイヤー・データフェッチはありません）。

スタイリングは MUI (Material UI) と `src/app/globals.css` のユーティリティクラス（`.container`, `.cards`, `.card`, `.input-section` など）を併用しています。既存のクラスがあれば新規CSSを追加せず再利用してください。

詳細なアーキテクチャ方針は [CLAUDE.md](./CLAUDE.md) を参照してください。

## Deploy

[Vercel](https://vercel.com/) にデプロイされています。
