import { findJsonError } from "../json-formatter/findJsonError";

export type TimeClaim = "exp" | "nbf" | "iat";

export interface DecodedJwt {
  header: string;
  payload: string;
  signature: string;
  // Date で表せる数値のときだけ入る
  expiresAt: Date | null;
  notBefore: Date | null;
  issuedAt: Date | null;
  isExpired: boolean;
  isNotYetValid: boolean;
}

export type DecodeJwtResult =
  | { ok: true; decoded: DecodedJwt }
  | { ok: false; error: string };

export const FORMAT_ERROR =
  "無効なJWT形式です(header.payload.signatureの3部構成である必要があります)";
export const JWE_ERROR =
  "暗号化されたJWT(JWE、5部構成)はデコードできません。署名付きのJWT(JWS、3部構成)を入力してください";
export type SegmentDecodeResult =
  | { ok: true; text: string }
  | { ok: false; reason: string };

const describeChar = (char: string): string => {
  if (char === "\n" || char === "\r") return "改行";
  if (/\s/.test(char)) return "空白";
  return `「${char}」`;
};

// JWT(RFC 7515)の各部は Base64URL(パディングなし)の文字だけで書かれる。
// atob は空白や = を黙って受け入れ、TextDecoder は既定で不正なバイトを置換文字にするので、
// どちらもここで先に弾く
export const decodeBase64UrlSegment = (segment: string): SegmentDecodeResult => {
  const invalid = Array.from(segment).find((c) => !/^[A-Za-z0-9_-]$/.test(c));
  if (invalid !== undefined) {
    return {
      ok: false,
      reason:
        invalid === "="
          ? "「=」が含まれています(JWTのBase64URLではパディングの「=」を付けません)"
          : `Base64URLで使えない文字(${describeChar(invalid)})が含まれています`,
    };
  }
  if (segment.length % 4 === 1) {
    return {
      ok: false,
      reason: "Base64URLの長さが正しくありません(途中で切れている可能性があります)",
    };
  }
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  try {
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, reason: "デコード結果がUTF-8のテキストではありません" };
  }
};

type JsonPartResult = { ok: true; value: unknown } | { ok: false; error: string };

// ヘッダーかペイロードを Base64URL → UTF-8 → JSON の順に読み、失敗したらどの部分の何が原因かを返す
const decodeJsonPart = (segment: string, label: string): JsonPartResult => {
  const decoded = decodeBase64UrlSegment(segment);
  if (!decoded.ok) return { ok: false, error: `${label}: ${decoded.reason}` };
  try {
    return { ok: true, value: JSON.parse(decoded.text) };
  } catch {
    const location = findJsonError(decoded.text);
    return {
      ok: false,
      error: location
        ? `${label}: JSONとして正しくありません(${location.line}行目${location.column}文字目: ${location.message})`
        : `${label}: JSONとして正しくありません`,
    };
  }
};

// Authorization ヘッダーの値をそのまま貼っても読めるよう、前後の空白と "Bearer " を取り除く
export const normalizeToken = (input: string): string =>
  input.trim().replace(/^Bearer(?:\s+|$)/i, "").trim();

// NumericDate(秒)をミリ秒にする。数値でなければ null
const claimMs = (payload: unknown, key: TimeClaim): number | null => {
  if (typeof payload !== "object" || payload === null) return null;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "number" ? value * 1000 : null;
};

// Date の範囲外(±8.64e15ミリ秒を超える)だと Invalid Date になるので null にする
const toDate = (ms: number | null): Date | null =>
  ms !== null && Number.isFinite(new Date(ms).getTime()) ? new Date(ms) : null;

// now は期限切れ判定の基準時刻(テストで固定できるよう引数にしている)
export const decodeJwt = (
  input: string,
  now: number = Date.now()
): DecodeJwtResult => {
  const parts = normalizeToken(input).split(".");
  if (parts.length === 5) {
    return { ok: false, error: JWE_ERROR };
  }
  if (parts.length !== 3) {
    return { ok: false, error: FORMAT_ERROR };
  }

  const header = decodeJsonPart(parts[0], "ヘッダー");
  if (!header.ok) return header;
  const payload = decodeJsonPart(parts[1], "ペイロード");
  if (!payload.ok) return payload;
  const payloadObj = payload.value;

  const expMs = claimMs(payloadObj, "exp");
  const nbfMs = claimMs(payloadObj, "nbf");

  return {
    ok: true,
    decoded: {
      header: JSON.stringify(header.value, null, 2),
      payload: JSON.stringify(payloadObj, null, 2),
      signature: parts[2],
      expiresAt: toDate(expMs),
      notBefore: toDate(nbfMs),
      issuedAt: toDate(claimMs(payloadObj, "iat")),
      // RFC 7519: exp の時刻ちょうども期限切れ、nbf の時刻ちょうどからは有効。
      // Date で表せないほど大きい値でも判定できるよう、数値のまま比較する
      isExpired: expMs !== null && expMs <= now,
      isNotYetValid: nbfMs !== null && nbfMs > now,
    },
  };
};
