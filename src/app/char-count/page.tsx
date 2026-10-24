"use client";
import { useMemo, useState } from "react";
import { countGraphemes } from "./countChars";

export default function CharCounterPage() {
  const [text, setText] = useState("");
  const charCount = useMemo(() => countGraphemes(text), [text]);

  return (
    <div className="container">
      <div className="main">
        <h1 className="title">文字数カウンター</h1>
        <div className="input-section">
          <textarea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="文字を入力してください"
            className="input-field"
          />
          <p className="char-count">文字数: {charCount}</p>
        </div>
      </div>
    </div>
  );
}
