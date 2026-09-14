import Link from "next/link";

export default function Home() {
  return (
    <div className="container">
      <main className="main">
        <h1 className="title">デベロッパーツール</h1>
        <div className="cards">
          <Link href="/char-count" className="card">
            <div className="card-content">
              <h3>文字数カウンター</h3>
              <p>テキストの文字数をカウントします</p>
            </div>
          </Link>
          <Link href="/json-formatter" className="card">
            <div className="card-content">
              <h3>JSON整形</h3>
              <p>JSONデータを整形して表示します</p>
            </div>
          </Link>
          <Link href="/jwt-decoder" className="card">
            <div className="card-content">
              <h3>JWTデコーダー</h3>
              <p>JWTのヘッダーとペイロードをデコードして表示します</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
