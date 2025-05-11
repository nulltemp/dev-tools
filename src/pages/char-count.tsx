import { useState } from "react";

export default function CharCounterPage() {
  const [text, setText] = useState("");

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>文字数カウンター</h1>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="文字を入力してください"
        style={{ width: "100%", padding: "10px", fontSize: "16px", marginBottom: "10px" }}
      />
      <p style={{ fontSize: "18px" }}>文字数: {text.length}</p>
    </div>
  );
}