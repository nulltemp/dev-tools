export const HASH_ALGORITHMS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

export type DigestFormat = "hex" | "HEX" | "base64";

// テキストは UTF-8 のバイト列としてハッシュする
const utf8 = (text: string): Uint8Array<ArrayBuffer> => new TextEncoder().encode(text);

export const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

export const toBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
};

export const formatDigest = (bytes: Uint8Array, format: DigestFormat): string => {
  if (format === "base64") return toBase64(bytes);
  const hex = toHex(bytes);
  return format === "HEX" ? hex.toUpperCase() : hex;
};

// Web Crypto(crypto.subtle)で計算するので、入力はどこにも送られない
// Web Crypto(crypto.subtle)が使えるか。HTTP など安全でないコンテキストでは undefined になる
export const isWebCryptoAvailable = (): boolean =>
  typeof crypto !== "undefined" && crypto.subtle !== undefined;

// 計算に失敗したときの表示用メッセージ。Web Crypto 非対応とそれ以外を分ける
export const hashErrorMessage = (error: unknown): string =>
  isWebCryptoAvailable()
    ? `ハッシュを計算できませんでした(${error instanceof Error ? error.message : String(error)})。`
    : "ハッシュを計算できませんでした。ブラウザが Web Crypto に対応していない可能性があります。";

export const digest = async (algorithm: HashAlgorithm, text: string): Promise<Uint8Array> =>
  new Uint8Array(await crypto.subtle.digest(algorithm, utf8(text)));

export const hmac = async (
  algorithm: HashAlgorithm,
  key: string,
  text: string
): Promise<Uint8Array> => {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    utf8(key),
    { name: "HMAC", hash: algorithm },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, utf8(text)));
};

// すべてのアルゴリズムの結果をまとめて返す。key を渡すと HMAC にする
// (Web Crypto は長さ0の HMAC 鍵を受け付けないので、空の key は呼び出し側で弾く)
export const hashAll = async (
  text: string,
  key?: string
): Promise<Record<HashAlgorithm, Uint8Array>> => {
  const values = await Promise.all(
    HASH_ALGORITHMS.map((algorithm) =>
      key === undefined ? digest(algorithm, text) : hmac(algorithm, key, text)
    )
  );
  return Object.fromEntries(HASH_ALGORITHMS.map((a, i) => [a, values[i]])) as Record<
    HashAlgorithm,
    Uint8Array
  >;
};
