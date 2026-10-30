"use client";
import React, { useState } from "react";
import CopyButton from "../CopyButton";
import { findTool } from "../tools";
import { decodeJwt } from "./decodeJwt";

const { name } = findTool("/jwt-decoder");

interface DecodedView {
  header: string;
  payload: string;
  signature: string;
  expiredMessage: string | null;
}

const JwtDecoder: React.FC = () => {
  const [input, setInput] = useState("");
  const [decoded, setDecoded] = useState<DecodedView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = () => {
    const result = decodeJwt(input);
    if (!result.ok) {
      setDecoded(null);
      setError(result.error);
      return;
    }

    const { header, payload, signature, expiresAt, isExpired } = result.decoded;
    const expiredMessage = expiresAt
      ? `有効期限(exp): ${expiresAt.toLocaleString("ja-JP")}${
          isExpired ? "(期限切れ)" : ""
        }`
      : null;

    setDecoded({ header, payload, signature, expiredMessage });
    setError(null);
  };

  // 入力と食い違った古い結果やエラーを表示し続けないよう、入力が変わったら消す
  const handleInputChange = (value: string) => {
    setInput(value);
    setDecoded(null);
    setError(null);
  };

  return (
    <div className="container">
      <div className="main">
        <h1 className="title">{name}</h1>
        <div className="input-section">
          <textarea
            rows={6}
            className="input-field"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="ここにJWTを入力してください"
            aria-label="デコードするJWT"
          />
          <div className="button-section">
            <button onClick={handleDecode}>デコード</button>
          </div>
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          {decoded && (
            <>
              <div className="result-header">
                <h2 className="section-title">ヘッダー</h2>
                <CopyButton text={decoded.header} label="ヘッダーをコピー" />
              </div>
              <pre className="formatted-json">{decoded.header}</pre>
              <div className="result-header">
                <h2 className="section-title">ペイロード</h2>
                <CopyButton text={decoded.payload} label="ペイロードをコピー" />
              </div>
              <pre className="formatted-json">{decoded.payload}</pre>
              {decoded.expiredMessage && (
                <p className="char-count">{decoded.expiredMessage}</p>
              )}
              <div className="result-header">
                <h2 className="section-title">署名</h2>
                <CopyButton text={decoded.signature} label="署名をコピー" />
              </div>
              <pre className="formatted-json">{decoded.signature}</pre>
              <p className="char-count">
                ※署名の検証は行っていません(デコードのみ)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JwtDecoder;
