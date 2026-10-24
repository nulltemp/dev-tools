"use client";
import { useMemo, useState } from "react";

// 絵文字や結合文字を1文字として数えるため、書記素単位で分割する
const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });

const countGraphemes = (text: string): number =>
  Array.from(segmenter.segment(text)).length;

export default function CharCounterPage() {
  const [text, setText] = useState("");
  const charCount = useMemo(() => countGraphemes(text), [text]);

  return (
    <div className="container">
      <main className="main">
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
      </main>
    </div>
  );
}
