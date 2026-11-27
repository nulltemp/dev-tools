export const HASH_ALGORITHMS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

export type DigestFormat = "hex" | "HEX" | "base64";

// テキストは UTF-8 のバイト列としてハッシュする
const utf8 = (text: string): Uint8Array<ArrayBuffer> => new TextEncoder().encode(text);

// ハッシュする入力。テキストは UTF-8 に、ファイルなどのバイト列はそのまま使う
export type HashInput = string | Uint8Array<ArrayBuffer>;

const toBytes = (input: HashInput): Uint8Array<ArrayBuffer> =>
  typeof input === "string" ? utf8(input) : input;

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

export const digest = async (algorithm: HashAlgorithm, data: HashInput): Promise<Uint8Array> =>
  new Uint8Array(await crypto.subtle.digest(algorithm, toBytes(data)));

export const hmac = async (
  algorithm: HashAlgorithm,
  key: string,
  data: HashInput
): Promise<Uint8Array> => {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    utf8(key),
    { name: "HMAC", hash: algorithm },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, toBytes(data)));
};

// すべてのアルゴリズムの結果をまとめて返す。key を渡すと HMAC にする
// (Web Crypto は長さ0の HMAC 鍵を受け付けないので、空の key は呼び出し側で弾く)
export const hashAll = async (
  data: HashInput,
  key?: string
): Promise<Record<HashAlgorithm, Uint8Array>> => {
  const values = await Promise.all(
    HASH_ALGORITHMS.map((algorithm) =>
      key === undefined ? digest(algorithm, data) : hmac(algorithm, key, data)
    )
  );
  return Object.fromEntries(HASH_ALGORITHMS.map((a, i) => [a, values[i]])) as Record<
    HashAlgorithm,
    Uint8Array
  >;
};

// 貼り付けた値と一致するアルゴリズムを返す(なければ undefined)。
// 16進は大文字・小文字を区別せず、Base64 はそのまま比べる。前後と途中の空白は無視する
export const findMatchingAlgorithm = (
  expected: string,
  digests: Record<HashAlgorithm, Uint8Array>
): HashAlgorithm | undefined => {
  const value = expected.replace(/\s+/g, "");
  if (!value) return undefined;
  return HASH_ALGORITHMS.find(
    (algorithm) =>
      toHex(digests[algorithm]) === value.toLowerCase() || toBase64(digests[algorithm]) === value
  );
};
