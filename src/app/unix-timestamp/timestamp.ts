export type ResolvedTimestampUnit = "seconds" | "milliseconds" | "microseconds" | "nanoseconds";
export type TimestampUnit = "auto" | ResolvedTimestampUnit;

export type ParseTimestampResult =
  | { ok: true; date: Date; unit: ResolvedTimestampUnit }
  | { ok: false; error: string };

export type ParseDateTimeResult =
  | { ok: true; date: Date }
  | { ok: false; error: string };

export const TIMESTAMP_UNIT_LABELS: Record<ResolvedTimestampUnit, string> = {
  seconds: "秒",
  milliseconds: "ミリ秒",
  microseconds: "マイクロ秒",
  nanoseconds: "ナノ秒",
};

// Date で表せる範囲(1970-01-01 から前後1億日)
// tsconfig の target が ES2017 で BigInt リテラル(0n など)を書けないため、BigInt() で作る
const ZERO = BigInt(0);
const ONE = BigInt(1);
const TEN = BigInt(10);
const MAX_MS = BigInt(8.64e15);

// 1単位をミリ秒に直すときの 10 の指数(秒なら ×10³、ナノ秒なら ×10⁻⁶)
const MS_EXPONENT: Record<ResolvedTimestampUnit, number> = {
  seconds: 3,
  milliseconds: 0,
  microseconds: -3,
  nanoseconds: -6,
};

// 「自動」のとき、絶対値がこの値以上なら大きい単位から順にその単位とみなす。
// 1e11 秒は西暦5138年、1e11 ミリ秒は1973年なので、普段使う値ならどちらとも取り違えない
// (マイクロ秒・ナノ秒も同じく 1000 倍ずつ)
const AUTO_THRESHOLDS: [number, ResolvedTimestampUnit][] = [
  [1e17, "nanoseconds"],
  [1e14, "microseconds"],
  [1e11, "milliseconds"],
];

const resolveAutoUnit = (value: number): ResolvedTimestampUnit =>
  AUTO_THRESHOLDS.find(([threshold]) => Math.abs(value) >= threshold)?.[1] ?? "seconds";

// 負の数でも過去方向へ丸める整数の割り算
const floorDiv = (a: bigint, b: bigint): bigint => {
  const q = a / b;
  return a % b !== ZERO && a < ZERO !== b < ZERO ? q - ONE : q;
};

export const parseTimestamp = (
  input: string,
  unit: TimestampUnit = "auto"
): ParseTimestampResult => {
  const text = input.trim();
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) {
    return { ok: false, error: "数値(例: 1700000000)を入力してください" };
  }
  const [, sign, intPart, fracPart = ""] = match;
  const resolved = unit === "auto" ? resolveAutoUnit(Number(text)) : unit;

  // ナノ秒の19桁は Number の精度を超えるので、BigInt で 値 × 10^exponent を正確に求める
  // (value = digits / 10^fracPart.length)
  const exponent = MS_EXPONENT[resolved];
  const digits = BigInt(sign + intPart + fracPart);
  const numerator = digits * TEN ** BigInt(Math.max(exponent, 0));
  const denominator = TEN ** BigInt(fracPart.length + Math.max(-exponent, 0));
  const absNumerator = numerator < ZERO ? -numerator : numerator;
  if (absNumerator > MAX_MS * denominator) {
    return { ok: false, error: "日時として表せる範囲を超えています" };
  }
  // ミリ秒未満は Date で扱えないので切り捨てる(負の値でも過去方向へ)
  return { ok: true, date: new Date(Number(floorDiv(numerator, denominator))), unit: resolved };
};

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

interface WallTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

// 指定したタイムゾーンでの年月日・時刻を返す
const toWallTime = (date: Date, timeZone: string): WallTime => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    era: "short",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  const era = parts.find((p) => p.type === "era")?.value;
  // 紀元前は 1 BC = 0年、2 BC = -1年 という天文学的な年に直す
  const year = era === "BC" ? 1 - get("year") : get("year");
  return {
    year,
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
    millisecond: date.getUTCMilliseconds(),
  };
};

const wallTimeToUtcMs = (w: WallTime): number => {
  const date = new Date(0);
  date.setUTCFullYear(w.year, w.month - 1, w.day);
  date.setUTCHours(w.hour, w.minute, w.second, w.millisecond);
  return date.getTime();
};

// そのタイムゾーンの UTC からのずれ(ミリ秒)。日本なら +9時間
const timeZoneOffsetMs = (date: Date, timeZone: string): number =>
  wallTimeToUtcMs(toWallTime(date, timeZone)) - date.getTime();

export const formatOffset = (date: Date, timeZone: string): string => {
  const minutes = Math.round(timeZoneOffsetMs(date, timeZone) / 60_000);
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
};

const formatYear = (year: number) =>
  year < 0 ? `-${pad(-year, 6)}` : year > 9999 ? `+${pad(year, 6)}` : pad(year, 4);

// 例: 2026-11-17 12:34:56(ミリ秒があるときは .789 を付ける)
export const formatDateTime = (date: Date, timeZone: string): string => {
  const w = toWallTime(date, timeZone);
  const ms = w.millisecond ? `.${pad(w.millisecond, 3)}` : "";
  return `${formatYear(w.year)}-${pad(w.month)}-${pad(w.day)} ${pad(w.hour)}:${pad(
    w.minute
  )}:${pad(w.second)}${ms}`;
};

// 例: 2026-11-17T12:34:56+09:00
export const formatIso = (date: Date, timeZone: string): string => {
  const offset = formatOffset(date, timeZone);
  return `${formatDateTime(date, timeZone).replace(" ", "T")}${
    offset === "+00:00" ? "Z" : offset
  }`;
};

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
  ["second", 1],
];

// 例: 3時間前、2日後。now はテストで固定できるよう引数にしている
export const formatRelative = (date: Date, now: number = Date.now()): string => {
  const diffSec = (date.getTime() - now) / 1000;
  const format = new Intl.RelativeTimeFormat("ja", { numeric: "always" });
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(diffSec) >= size || unit === "second") {
      // 0 に向かって丸め、「59分前」が「1時間前」にならないようにする
      // Intl は「3 時間前」と数字の後に空白を入れるので詰める
      return format.format(Math.trunc(diffSec / size), unit).replace(/\s+/g, "");
    }
  }
  return "";
};

const DATE_TIME_PATTERN =
  /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?\s*(Z|[+-]\d{2}(?::?\d{2})?)?$/i;

// 2026-11-17 12:34:56、2026/11/17、2026-11-17T12:34:56.789+09:00、
// 2026-11-17 12:00:00.123456+09 などを受け付ける。小数秒のミリ秒未満は切り捨てる。
// オフセットがなければ timeZone の時刻として解釈する
export const parseDateTime = (
  input: string,
  timeZone: string
): ParseDateTimeResult => {
  const match = DATE_TIME_PATTERN.exec(input.trim());
  if (!match) {
    return {
      ok: false,
      error: "日時は「2026-11-17 12:34:56」の形式で入力してください",
    };
  }
  const [, y, mo, d, h = "0", mi = "0", s = "0", frac = "", offset] = match;
  const wall: WallTime = {
    year: Number(y),
    month: Number(mo),
    day: Number(d),
    hour: Number(h),
    minute: Number(mi),
    second: Number(s),
    // Date はミリ秒までしか扱えないので、マイクロ秒・ナノ秒は切り捨てる
    millisecond: Number(frac.slice(0, 3).padEnd(3, "0")),
  };

  const utcMs = wallTimeToUtcMs(wall);
  const check = new Date(utcMs);
  if (
    wall.hour > 23 ||
    wall.minute > 59 ||
    wall.second > 59 ||
    check.getUTCMonth() + 1 !== wall.month ||
    check.getUTCDate() !== wall.day
  ) {
    return { ok: false, error: "存在しない日時です" };
  }

  if (offset) {
    if (offset.toUpperCase() === "Z") return { ok: true, date: new Date(utcMs) };
    const offsetHours = Number(offset.slice(1, 3));
    // 「+09」のように分のないオフセットは 0分とする
    const offsetMinutes = Number(offset.slice(3).replace(":", "") || "0");
    // ISO 8601 の範囲(時 00〜23、分 00〜59)を超えるものは受け付けない
    if (offsetHours > 23 || offsetMinutes > 59) {
      return { ok: false, error: "存在しないオフセットです" };
    }
    const offsetMs =
      (offset[0] === "-" ? -1 : 1) * (offsetHours * 60 + offsetMinutes) * 60_000;
    return { ok: true, date: new Date(utcMs - offsetMs) };
  }

  // オフセットは時刻によって変わる(夏時間)ため、求めた時刻でもう一度確かめる
  const firstGuess = utcMs - timeZoneOffsetMs(new Date(utcMs), timeZone);
  const offsetAtGuess = timeZoneOffsetMs(new Date(firstGuess), timeZone);
  const date = new Date(utcMs - offsetAtGuess);
  // 夏時間が始まるときに飛ばされる時刻(例: New York の 2026-03-08 02:30)は、
  // 現地時刻に戻すと入力と一致しないので受け付けない
  const back = toWallTime(date, timeZone);
  if (
    back.year !== wall.year ||
    back.month !== wall.month ||
    back.day !== wall.day ||
    back.hour !== wall.hour ||
    back.minute !== wall.minute ||
    back.second !== wall.second
  ) {
    return { ok: false, error: "夏時間の切り替えで存在しない時刻です" };
  }
  return { ok: true, date };
};
