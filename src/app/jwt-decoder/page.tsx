"use client";
import React, { useState } from "react";
import CopyButton from "../CopyButton";
import { findTool } from "../tools";
import { decodeJwt, type DecodedJwt } from "./decodeJwt";

const { name } = findTool("/jwt-decoder");

interface TimeNote {
  label: string;
  text: string;
  alert: boolean;
}

interface DecodedView {
  header: string;
  payload: string;
  signature: string;
  timeNotes: TimeNote[];
}

const formatDate = (date: Date) => date.toLocaleString("ja-JP");

const toTimeNotes = (decoded: DecodedJwt): TimeNote[] => {
  const notes: TimeNote[] = [];
  if (decoded.issuedAt) {
    notes.push({
      label: "発行日時(iat)",
      text: formatDate(decoded.issuedAt),
      alert: false,
    });
  }
  if (decoded.notBefore) {
    notes.push({
      label: "有効開始(nbf)",
      text: `${formatDate(decoded.notBefore)}${
        decoded.isNotYetValid ? "(まだ有効ではありません)" : ""
      }`,
      alert: decoded.isNotYetValid,
    });
  }
  if (decoded.expiresAt) {
    notes.push({
      label: "有効期限(exp)",
      text: `${formatDate(decoded.expiresAt)}${
        decoded.isExpired ? "(期限切れ)" : ""
      }`,
      alert: decoded.isExpired,
    });
  }
  return notes;
};

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

    const { header, payload, signature } = result.decoded;
    setDecoded({
      header,
      payload,
      signature,
      timeNotes: toTimeNotes(result.decoded),
    });
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
          <p className="note">
            入力したJWTはブラウザ内でデコードされ、どこにも送信されません。
            {"「Bearer 」付きのまま貼り付けても読み取れます。"}
          </p>
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
              {decoded.timeNotes.map((note) => (
                <p
                  key={note.label}
                  className={note.alert ? "note note-alert" : "note"}
                >
                  {note.label}: {note.text}
                </p>
              ))}
              <div className="result-header">
                <h2 className="section-title">署名</h2>
                <CopyButton text={decoded.signature} label="署名をコピー" />
              </div>
              <pre className="formatted-json">{decoded.signature}</pre>
              <p className="note">
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
