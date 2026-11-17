"use client";
import React, { useState, useSyncExternalStore } from "react";
import CopyButton from "../CopyButton";
import { findTool } from "../tools";
import {
  formatDateTime,
  formatIso,
  formatRelative,
  parseDateTime,
  parseTimestamp,
  type TimestampUnit,
} from "./timestamp";

const { name } = findTool("/unix-timestamp");

type ZoneChoice = "local" | "utc";

// ブラウザのタイムゾーンはサーバーでの事前レンダリング時には分からないので、
// クライアントでだけ読む(サーバーでは null)
const subscribeNothing = () => () => {};
const useLocalTimeZone = () =>
  useSyncExternalStore(
    subscribeNothing,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => null
  );

interface ResultRow {
  label: string;
  value: string;
  copyable?: boolean;
}

const ResultTable: React.FC<{ rows: ResultRow[] }> = ({ rows }) => (
  <table className="result-table">
    <tbody>
      {rows.map((row) => (
        <tr key={row.label}>
          <th scope="row">{row.label}</th>
          <td className="result-value">{row.value}</td>
          <td className="result-copy">
            {row.copyable !== false && (
              <CopyButton text={row.value} label={`${row.label}をコピー`} />
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const UnixTimestamp: React.FC = () => {
  const localTimeZone = useLocalTimeZone();

  // タイムスタンプ → 日時
  const [timestampInput, setTimestampInput] = useState("");
  const [unit, setUnit] = useState<TimestampUnit>("auto");
  // 相対時間の基準。入力が変わったときに更新する
  const [now, setNow] = useState(0);

  // 日時 → タイムスタンプ
  const [dateInput, setDateInput] = useState("");
  const [zone, setZone] = useState<ZoneChoice>("local");

  const handleTimestampChange = (value: string) => {
    setTimestampInput(value);
    setNow(Date.now());
  };

  const handleTimestampNow = () => {
    const current = Date.now();
    setTimestampInput(String(Math.floor(current / 1000)));
    setUnit("auto");
    setNow(current);
  };

  const handleDateNow = () => {
    if (!localTimeZone) return;
    const timeZone = zone === "utc" ? "UTC" : localTimeZone;
    setDateInput(formatDateTime(new Date(Math.floor(Date.now() / 1000) * 1000), timeZone));
  };

  // 入力から直接計算するので、入力と食い違った古い結果は残らない
  const timestampResult =
    timestampInput.trim() && localTimeZone
      ? parseTimestamp(timestampInput, unit)
      : null;
  const dateTimeZone = zone === "utc" ? "UTC" : localTimeZone;
  const dateResult =
    dateInput.trim() && dateTimeZone ? parseDateTime(dateInput, dateTimeZone) : null;

  return (
    <div className="container">
      <div className="main">
        <h1 className="title">{name}</h1>
        <div className="input-section">
          <p className="note">
            日時はブラウザのタイムゾーン
            {localTimeZone && `(${localTimeZone})`}
            とUTCで表示します。入力はブラウザ内で変換され、送信されません。
          </p>

          <h2 className="section-title tool-section-title">タイムスタンプ → 日時</h2>
          <div className="input-row">
            <input
              type="text"
              inputMode="decimal"
              className="input-mono"
              value={timestampInput}
              onChange={(e) => handleTimestampChange(e.target.value)}
              placeholder="例: 1700000000"
              aria-label="変換するUnixタイムスタンプ"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as TimestampUnit)}
              aria-label="タイムスタンプの単位"
            >
              <option value="auto">自動判定</option>
              <option value="seconds">秒</option>
              <option value="milliseconds">ミリ秒</option>
            </select>
            <button onClick={handleTimestampNow}>現在時刻</button>
          </div>
          {timestampResult && !timestampResult.ok && (
            <div className="error-message" role="alert">
              {timestampResult.error}
            </div>
          )}
          {timestampResult?.ok && localTimeZone && (
            <>
              <ResultTable
                rows={[
                  {
                    label: `ローカル(${localTimeZone})`,
                    value: formatDateTime(timestampResult.date, localTimeZone),
                  },
                  { label: "UTC", value: formatDateTime(timestampResult.date, "UTC") },
                  { label: "ISO 8601", value: formatIso(timestampResult.date, localTimeZone) },
                  {
                    label: "現在との差",
                    value: formatRelative(timestampResult.date, now),
                    copyable: false,
                  },
                ]}
              />
              {unit === "auto" && (
                <p className="note">
                  {timestampResult.unit === "seconds" ? "秒" : "ミリ秒"}
                  として解釈しました(桁数から自動判定)
                </p>
              )}
            </>
          )}

          <h2 className="section-title tool-section-title">日時 → タイムスタンプ</h2>
          <div className="input-row">
            <input
              type="text"
              className="input-mono"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              placeholder="例: 2026-11-17 12:34:56"
              aria-label="変換する日時"
            />
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value as ZoneChoice)}
              aria-label="日時のタイムゾーン"
            >
              <option value="local">ローカル</option>
              <option value="utc">UTC</option>
            </select>
            <button onClick={handleDateNow}>現在時刻</button>
          </div>
          {dateResult && !dateResult.ok && (
            <div className="error-message" role="alert">
              {dateResult.error}
            </div>
          )}
          {dateResult?.ok && (
            <ResultTable
              rows={[
                {
                  label: "秒",
                  value: String(Math.floor(dateResult.date.getTime() / 1000)),
                },
                { label: "ミリ秒", value: String(dateResult.date.getTime()) },
                { label: "ISO 8601(UTC)", value: formatIso(dateResult.date, "UTC") },
              ]}
            />
          )}
          <p className="note">
            「2026-11-17T12:34:56+09:00」のようにオフセットを付けると、選んだタイムゾーンより優先します。
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnixTimestamp;
