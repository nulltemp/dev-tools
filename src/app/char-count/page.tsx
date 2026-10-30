"use client";
import { useMemo, useState } from "react";
import { findTool } from "../tools";
import { countGraphemes } from "./countChars";

const { name } = findTool("/char-count");

export default function CharCounterPage() {
  const [text, setText] = useState("");
  const charCount = useMemo(() => countGraphemes(text), [text]);

  return (
    <div className="container">
      <div className="main">
        <h1 className="title">{name}</h1>
        <div className="input-section">
          <textarea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="文字を入力してください"
            className="input-field"
            aria-label="文字数を数えるテキスト"
          />
          <p className="char-count">文字数: {charCount}</p>
        </div>
      </div>
    </div>
  );
}
