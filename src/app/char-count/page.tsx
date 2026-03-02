"use client";
import { useState } from "react";

export default function CharCounterPage() {
  const [text, setText] = useState("");

  return (
    <div className="container">
      <main className="main">
        <h1 className="title">文字数カウンター</h1>
        <div className="input-section">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="文字を入力してください"
            className="input-field"
          />
          <p className="char-count">文字数: {text.length}</p>
        </div>
      </main>
    </div>
  );
}
