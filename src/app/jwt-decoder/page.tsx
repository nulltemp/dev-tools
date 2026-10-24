"use client";
import React, { useState } from "react";
import { decodeJwt } from "./decodeJwt";

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

  return (
    <div className="container">
      <div className="main">
        <h1 className="title">JWTデコーダー</h1>
        <div className="input-section">
          <textarea
            rows={6}
            className="input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ここにJWTを入力してください"
          />
          <div className="button-section">
            <button onClick={handleDecode}>デコード</button>
          </div>
          {error && <div className="error-message">{error}</div>}
          {decoded && (
            <>
              <h2 className="section-title">ヘッダー</h2>
              <pre className="formatted-json">{decoded.header}</pre>
              <h2 className="section-title">ペイロード</h2>
              <pre className="formatted-json">{decoded.payload}</pre>
              {decoded.expiredMessage && (
                <p className="char-count">{decoded.expiredMessage}</p>
              )}
              <h2 className="section-title">署名</h2>
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
