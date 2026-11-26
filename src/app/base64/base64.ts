export type DecodeBase64Result =
  | { ok: true; text: string; bytes: Uint8Array; mimeType?: string }
  // Base64 としては正しいが、UTF-8 のテキストとして読めない(画像などのバイナリ)
  | { ok: false; error: string; bytes: Uint8Array; mimeType?: string }
  | { ok: false; error: string; bytes?: undefined; mimeType?: undefined };

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
export const encodeBase64 = (text: string, { urlSafe = false } = {}): string =>
  encodeBase64Bytes(new TextEncoder().encode(text), { urlSafe });

// バイト列(ファイルの中身など)を Base64 にする
export const encodeBase64Bytes = (bytes: Uint8Array, { urlSafe = false } = {}): string => {
  const base64 = btoa(bytesToBinary(bytes));
  if (!urlSafe) return base64;
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// バイト列を data URL(data:<MIME>;base64,...)にする。MIME が不明なら application/octet-stream
export const toDataUrl = (bytes: Uint8Array, mimeType: string): string =>
  `data:${mimeType || "application/octet-stream"};base64,${encodeBase64Bytes(bytes)}`;

// Base64 と Base64URL のどちらも受け付ける。空白・改行、= の省略、data URL の前置きは許す
export const decodeBase64 = (input: string): DecodeBase64Result => {
  const trimmed = input.trim();
  // data URL の MIME タイプ(data:image/png;base64,... の image/png)。パラメーター(;charset=...)は除く
  const dataUrl = trimmed.match(/^data:([^,]*);base64,/i);
  const declaredMime = dataUrl?.[1].split(";")[0].trim().toLowerCase() || undefined;
  let normalized = dataUrl ? trimmed.slice(dataUrl[0].length) : trimmed;
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
  const mimeType = declaredMime ?? sniffMimeType(bytes);
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, text, bytes, ...(mimeType && { mimeType }) };
  } catch {
    return {
      ok: false,
      error: "デコード結果がUTF-8のテキストではありません(画像などのバイナリデータの可能性があります)",
      bytes,
      ...(mimeType && { mimeType }),
    };
  }
};

// よく使う画像・PDF・ZIP を先頭のバイト列(マジックナンバー)から判別する。分からなければ undefined
const SIGNATURES: { mime: string; bytes: (number | null)[] }[] = [
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  // RIFF????WEBP
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50] },
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  { mime: "application/zip", bytes: [0x50, 0x4b, 0x03, 0x04] },
];

export const sniffMimeType = (bytes: Uint8Array): string | undefined =>
  SIGNATURES.find(
    (s) => bytes.length >= s.bytes.length && s.bytes.every((b, i) => b === null || bytes[i] === b)
  )?.mime;

// 先頭 limit バイトの16進ダンプ(1行16バイト、行頭にオフセット)
export const hexDump = (bytes: Uint8Array, limit = 256): string => {
  const lines: string[] = [];
  const end = Math.min(bytes.length, limit);
  for (let offset = 0; offset < end; offset += 16) {
    const row = Array.from(bytes.subarray(offset, Math.min(offset + 16, end)), (b) =>
      b.toString(16).padStart(2, "0")
    );
    lines.push(`${offset.toString(16).padStart(8, "0")}  ${row.join(" ")}`);
  }
  return lines.join("\n");
};

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
  "application/zip": "zip",
  "application/json": "json",
  "text/plain": "txt",
};

// 保存するファイルの名前。MIME から拡張子を決め、分からなければ .bin
export const downloadFileName = (mimeType: string | undefined): string =>
  `decoded.${(mimeType && EXTENSIONS[mimeType]) || "bin"}`;

// <img> でプレビューしてよい MIME か(img 要素の SVG はスクリプトを実行しない)
export const isPreviewableImage = (mimeType: string | undefined): boolean =>
  !!mimeType && /^image\/(png|jpeg|gif|webp|svg\+xml|bmp|avif|x-icon|vnd\.microsoft\.icon)$/.test(mimeType);
