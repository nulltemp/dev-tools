import Link from "next/link";

export default function Home() {
  return (
    <div className="container">
      <div className="main">
        <h1 className="title">デベロッパーツール</h1>
        <div className="cards">
          <Link href="/char-count" className="card">
            <div className="card-content">
              <h2>文字数カウンター</h2>
              <p>テキストの文字数をカウントします</p>
            </div>
          </Link>
          <Link href="/json-formatter" className="card">
            <div className="card-content">
              <h2>JSON整形</h2>
              <p>JSONデータを整形して表示します</p>
            </div>
          </Link>
          <Link href="/jwt-decoder" className="card">
            <div className="card-content">
              <h2>JWTデコーダー</h2>
              <p>JWTのヘッダーとペイロードをデコードして表示します</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
