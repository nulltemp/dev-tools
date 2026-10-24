export interface DecodedJwt {
  header: string;
  payload: string;
  signature: string;
  expiresAt: Date | null;
  isExpired: boolean;
}

export type DecodeJwtResult =
  | { ok: true; decoded: DecodedJwt }
  | { ok: false; error: string };

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

// now は期限切れ判定の基準時刻(テストで固定できるよう引数にしている)
export const decodeJwt = (
  input: string,
  now: number = Date.now()
): DecodeJwtResult => {
  const parts = input.trim().split(".");
  if (parts.length !== 3) {
    return {
      ok: false,
      error:
        "無効なJWT形式です(header.payload.signatureの3部構成である必要があります)",
    };
  }

  try {
    const header = JSON.stringify(JSON.parse(base64UrlDecode(parts[0])), null, 2);
    const payloadObj: unknown = JSON.parse(base64UrlDecode(parts[1]));
    const payload = JSON.stringify(payloadObj, null, 2);

    const exp =
      typeof payloadObj === "object" && payloadObj !== null
        ? (payloadObj as { exp?: unknown }).exp
        : undefined;
    const expiresAt = typeof exp === "number" ? new Date(exp * 1000) : null;
    const isExpired = expiresAt !== null && expiresAt.getTime() < now;

    return {
      ok: true,
      decoded: { header, payload, signature: parts[2], expiresAt, isExpired },
    };
  } catch {
    return { ok: false, error: "JWTのデコードに失敗しました" };
  }
};
