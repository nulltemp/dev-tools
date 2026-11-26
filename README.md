# dev-tools

小さな独立したデベロッパー向けユーティリティツール集です。Next.js (App Router) 製で、以下のURLに公開されています。

https://dev-tools.nulltemp.com

## 現在のツール

- 文字数カウンター (`/char-count`) — テキストの文字数をカウントします
- JSON整形 (`/json-formatter`) — JSONデータを整形して表示します
- JWTデコーダー (`/jwt-decoder`) — JWTのヘッダーとペイロードをデコードして表示します（署名の検証は行いません）
- Unixタイムスタンプ変換 (`/unix-timestamp`) — Unixタイムスタンプと日時を相互に変換します
- Base64エンコード・デコード (`/base64`) — テキストをBase64にエンコード、Base64をテキストにデコードします
- URLエンコード・デコード (`/url-encode`) — テキストをパーセントエンコード、またはデコードします
- UUID生成 (`/uuid`) — UUID(v4・v7)をまとめて生成します
- ハッシュ生成 (`/hash`) — テキストのSHA-1・SHA-256・SHA-384・SHA-512ハッシュ(HMACも)を計算します
- テキスト差分 (`/diff`) — 2つのテキストの差分(diff)を行単位で表示し、変更された文字も強調します
- 正規表現テスター (`/regex`) — 正規表現をテキストに当て、一致した箇所・キャプチャグループ・置換結果を表示します

## Getting Started

パッケージマネージャーは npm を使用しています。Node.js は 22 が必要です（`.node-version` で 22、`package.json` の `engines` で `>=22.12` を指定しています）。

```bash
npm install
npm run dev      # 開発サーバー起動 (Next.js + Turbopack) http://localhost:3000
npm run build    # 本番ビルド
npm run start    # 本番ビルド (out/) を http://localhost:4173 で配信
npm run lint     # ESLint (eslint .)
npm test         # テスト実行 (Vitest)
```

テストは Vitest で、各ツールのロジック（`src/app/<tool-name>/*.ts`）の隣に `*.test.ts` として置いています。

画面の操作を確かめる E2E テストは Playwright で、`e2e/` に置いています。本番と同じ静的ファイルに対して動かすため、先にビルドしてから実行します（初回はブラウザのインストールも必要です）。

```bash
npx playwright install chromium  # 初回のみ
npm run build
npm run test:e2e
```

## ツールの追加方法

1. `src/app/<tool-name>/page.tsx` に新しいルートを作成する
2. `src/app/tools.ts` の `tools` 配列にツール（`href`・`name`・`description`）を追加する（サイドバー・ホームのカード・サイトマップはここから自動生成されます）
3. `src/app/<tool-name>/layout.tsx` を作成し、`export const metadata = toolMetadata("/<tool-name>");` でタイトル・canonical・OGPを設定し、`<JsonLd data={toolJsonLd("/<tool-name>")} />` で構造化データを出力する（既存ツールの `layout.tsx` を参照）
4. `src/app/toolGuides.ts` にツールの使い方（`usage`）と用語の解説（`terms`）を追加し、`ToolPage` に `guide={toolGuides["/<tool-name>"]}` を渡す（ツールの下に解説として表示されます。`src/app/tools.test.ts` と `e2e/site.spec.ts` が全ツールに解説があることを確かめるので、ないとテストが失敗します）

あわせて、次のことも守ってください。

- ページは `ToolPage` で包み、`findTool("/<tool-name>")` の `name`・`description` を渡す（見出しをナビゲーションと揃えるため）。入力欄には `aria-label` を付ける
- ロジックは `page.tsx` に書かず、隣のモジュール（例: `jwt-decoder/decodeJwt.ts`）に切り出して `*.test.ts` で単体テストする
- 主な操作の E2E テストを `e2e/tools.spec.ts` に追加する（ナビゲーション・見出し・横はみ出しは `e2e/site.spec.ts` が全ツール分を確かめます）

詳しい手順と決まりごとは [CLAUDE.md](./CLAUDE.md) の「Adding a new tool」を参照してください。

各ツールページは `"use client"` の自己完結したコンポーネントで、独自の `useState` ベースのロジックのみを持ちます（ツール間の共有状態・APIレイヤー・データフェッチはありません）。

スタイリングは MUI (Material UI) に統一しています。配色・ダークモード・フォントなどは `src/app/theme.ts` で管理し、各ページは MUI コンポーネントと `sx` で組み立ててください。ページの外枠には `ToolPage`、コピー付きの整形済み表示には `CodeBlock` を使います。

詳細なアーキテクチャ方針は [CLAUDE.md](./CLAUDE.md) を参照してください。

未対応の改善点は [GitHub の Issue](https://github.com/nulltemp/dev-tools/issues) で管理しています。
