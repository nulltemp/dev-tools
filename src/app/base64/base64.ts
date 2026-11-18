export type DecodeBase64Result =
  | { ok: true; text: string }
  | { ok: false; error: string };

const bytesToBinary = (bytes: Uint8Array): string => {
  // 大きな入力で引数の数の上限を超えないよう、少しずつ文字列にする
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return binary;
};

// テキストを UTF-8 のバイト列として Base64 にする。
// urlSafe では + / を - _ にし、末尾の = を付けない(Base64URL)
export const encodeBase64 = (text: string, { urlSafe = false } = {}): string => {
  const base64 = btoa(bytesToBinary(new TextEncoder().encode(text)));
  if (!urlSafe) return base64;
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// Base64 と Base64URL のどちらも受け付ける。空白・改行、= の省略、data URL の前置きは許す
export const decodeBase64 = (input: string): DecodeBase64Result => {
  let normalized = input.trim().replace(/^data:[^,]*;base64,/i, "");
  normalized = normalized.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    const invalid = normalized.match(/[^A-Za-z0-9+/=]/)?.[0];
    return {
      ok: false,
      error: invalid
        ? `Base64で使えない文字「${invalid}」が含まれています`
        : "「=」は末尾にだけ置けます",
    };
  }

  const body = normalized.replace(/=+$/, "");
  if (body.length % 4 === 1) {
    return { ok: false, error: "Base64の長さが正しくありません(途中で切れている可能性があります)" };
  }
  const padded = body + "=".repeat((4 - (body.length % 4)) % 4);

  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  try {
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return {
      ok: false,
      error: "デコード結果がUTF-8のテキストではありません(画像などのバイナリデータの可能性があります)",
    };
  }
};
