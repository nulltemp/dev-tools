"use client";
import React, { useState } from "react";
import CopyButton from "../CopyButton";
import { findTool } from "../tools";
import { formatJson } from "./formatJson";

const { name } = findTool("/json-formatter");

const JsonFormatter: React.FC = () => {
  const [input, setInput] = useState("");
  const [formatted, setFormatted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFormat = () => {
    const result = formatJson(input);
    setFormatted(result.ok ? result.formatted : null);
    setError(result.ok ? null : result.error);
  };

  // 入力と食い違った古い結果やエラーを表示し続けないよう、入力が変わったら消す
  const handleInputChange = (value: string) => {
    setInput(value);
    setFormatted(null);
    setError(null);
  };

  return (
    <div className="container">
      <div className="main">
        <h1 className="title">{name}</h1>
        <div className="input-section">
          <textarea
            rows={10}
            className="input-field"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="ここにJSONを入力してください"
            aria-label="整形するJSON"
          />
          <div className="button-section">
            <button onClick={handleFormat}>整形</button>
          </div>
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          {formatted && (
            <>
              <div className="result-header">
                <CopyButton text={formatted} label="整形結果をコピー" />
              </div>
              <pre className="formatted-json">{formatted}</pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JsonFormatter;
