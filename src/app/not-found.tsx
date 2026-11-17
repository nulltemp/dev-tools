import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ページが見つかりません",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="container">
      <div className="main">
        <h1 className="title">ページが見つかりません</h1>
        <p className="not-found-message">
          お探しのページは移動または削除されたか、URLが間違っている可能性があります。
        </p>
        <p>
          <Link href="/">ツール一覧に戻る</Link>
        </p>
      </div>
    </div>
  );
}
