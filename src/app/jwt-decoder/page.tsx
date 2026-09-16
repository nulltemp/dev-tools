"use client";
import React, { useState } from "react";

interface DecodedJwt {
  header: string;
  payload: string;
  signature: string;
  expiredMessage: string | null;
}

const base64UrlDecode = (segment: string): string => {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
};

const JwtDecoder: React.FC = () => {
  const [input, setInput] = useState("");
  const [decoded, setDecoded] = useState<DecodedJwt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = () => {
    const parts = input.trim().split(".");
    if (parts.length !== 3) {
      setDecoded(null);
      setError("無効なJWT形式です(header.payload.signatureの3部構成である必要があります)");
      return;
    }

    try {
      const header = JSON.stringify(JSON.parse(base64UrlDecode(parts[0])), null, 2);
      const payloadObj = JSON.parse(base64UrlDecode(parts[1]));
      const payload = JSON.stringify(payloadObj, null, 2);

      let expiredMessage: string | null = null;
      if (typeof payloadObj.exp === "number") {
        const expDate = new Date(payloadObj.exp * 1000);
        const isExpired = expDate.getTime() < Date.now();
        expiredMessage = `有効期限(exp): ${expDate.toLocaleString("ja-JP")}${
          isExpired ? "(期限切れ)" : ""
        }`;
      }

      setDecoded({ header, payload, signature: parts[2], expiredMessage });
      setError(null);
    } catch (e: unknown) {
      console.error(e);
      setDecoded(null);
      setError("JWTのデコードに失敗しました");
    }
  };

  return (
    <div className="container">
      <main className="main">
        <h2 className="title">JWTデコーダー</h2>
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
              <h3>ヘッダー</h3>
              <pre className="formatted-json">{decoded.header}</pre>
              <h3>ペイロード</h3>
              <pre className="formatted-json">{decoded.payload}</pre>
              {decoded.expiredMessage && (
                <p className="char-count">{decoded.expiredMessage}</p>
              )}
              <h3>署名</h3>
              <pre className="formatted-json">{decoded.signature}</pre>
              <p className="char-count">
                ※署名の検証は行っていません(デコードのみ)
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default JwtDecoder;
