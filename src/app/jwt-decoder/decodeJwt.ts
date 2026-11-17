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
export const DECODE_ERROR = "JWTのデコードに失敗しました";

export const base64UrlDecode = (segment: string): string => {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
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

  try {
    const header = JSON.stringify(JSON.parse(base64UrlDecode(parts[0])), null, 2);
    const payloadObj: unknown = JSON.parse(base64UrlDecode(parts[1]));
    const payload = JSON.stringify(payloadObj, null, 2);

    const expMs = claimMs(payloadObj, "exp");
    const nbfMs = claimMs(payloadObj, "nbf");

    return {
      ok: true,
      decoded: {
        header,
        payload,
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
  } catch {
    return { ok: false, error: DECODE_ERROR };
  }
};
