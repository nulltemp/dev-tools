"use client";
import React, { useState } from "react";
import { formatJson } from "./formatJson";

const JsonFormatter: React.FC = () => {
  const [input, setInput] = useState("");
  const [formatted, setFormatted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFormat = () => {
    const result = formatJson(input);
    setFormatted(result.ok ? result.formatted : null);
    setError(result.ok ? null : result.error);
  };

  return (
    <div className="container">
      <div className="main">
        <h1 className="title">JSON整形ツール</h1>
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
      </div>
    </div>
  );
};

export default JsonFormatter;
