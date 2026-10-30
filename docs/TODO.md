# 未対応の改善点

プロジェクト全体を見直した際に見つかった、まだ対応していない改善点の一覧です。対応したものはこの一覧から削除してください。

## コード品質・保守性

### MUI を設定しているが使っていない

`@mui/material` と `@emotion/*` を導入し、`layout.tsx` で `ThemeProvider` と `AppRouterCacheProvider` を設定しているが、MUI のコンポーネントはどのページでも使われていない。ダークモードの設定も `globals.css` の CSS 変数と `theme.ts` の `colorSchemes` で二重になっている。

- 対応案: MUI を使っていく方針ならツールページを MUI コンポーネントに置き換える。使わないなら依存とプロバイダーを外してバンドルを軽くする。

### 用途に合わない CSS クラスを流用している

`jwt-decoder/page.tsx` の有効期限の表示と「署名の検証は行っていません」の注記に `.char-count`（文字数表示用のクラス）を使っている。また、期限切れでも見た目が変わらない。

- 対応案: `.note` や `.warning-message` のような汎用クラスを `globals.css` に追加する。期限切れのときは `--warning` / `--error` の色で表示する。

### ページの書き方がそろっていない

- `char-count/page.tsx` は `export default function`、`json-formatter` と `jwt-decoder` は `React.FC` で書かれている。
- `theme.ts` だけシングルクォートを使っている。
- Prettier などのフォーマッターが入っていない。

## UX・アクセシビリティ

### 見出しの順番

DOM の並びで、サイドバーの `<h2 className="sidebar-title">ツール</h2>` が各ページの `<h1>` より前に来る。

### JSON整形のエラーで場所がわからない

`formatJson.ts` はエラーメッセージを「無効なJSONです」に固定しているため、どこが間違っているか分からない。

- 対応案: `JSON.parse` が投げるエラーのメッセージ（何文字目か）を表示する。

### JWTデコーダーの入力まわり

- `Bearer xxx` の形で貼り付けると形式エラーになる（先頭の `Bearer ` を取り除くとよい）。
- `iat` / `nbf` は日時として表示されない。
- 5部構成のトークン（JWE）にも「3部構成である必要があります」とだけ表示される。

### 細かい CSS の調整

- `.card:hover` のアニメーションが `prefers-reduced-motion`（動きを減らす設定）を考慮していない。
- `.card:hover` の影の色がハードコードされていて、ダークモード用の変数（`--card-shadow` など）を使っていない。
