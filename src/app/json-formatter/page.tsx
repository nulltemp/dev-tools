"use client";
import React, { useState } from "react";

const JsonFormatter: React.FC = () => {
  const [input, setInput] = useState("");
  const [formatted, setFormatted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFormat = () => {
    try {
      const obj = JSON.parse(input);
      setFormatted(JSON.stringify(obj, null, 2));
      setError(null);
    } catch (e: unknown) {
      console.error(e);
      setFormatted(null);
      setError("無効なJSONです");
    }
  };

  return (
    <div className="container">
      <main className="main">
        <h2 className="title">JSON整形ツール</h2>
        <div className="input-section">
          <textarea
            rows={10}
            className="input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ここにJSONを入力してください"
          />
          <div className="button-section">
            <button onClick={handleFormat}>整形</button>
          </div>
          {error && <div className="error-message">{error}</div>}
          {formatted && <pre className="formatted-json">{formatted}</pre>}
        </div>
      </main>
    </div>
  );
};

export default JsonFormatter;
