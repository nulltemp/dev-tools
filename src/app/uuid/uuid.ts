export type UuidVersion = "v4" | "v7";

export interface UuidFormat {
  uppercase?: boolean;
  hyphens?: boolean;
}

export const MAX_COUNT = 100;

// テストで差し替えられるよう、乱数と現在時刻は引数で受け取る
type RandomBytes = (length: number) => Uint8Array;

const cryptoRandomBytes: RandomBytes = (length) =>
  crypto.getRandomValues(new Uint8Array(length));

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

const withHyphens = (hex: string): string =>
  [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join(
    "-"
  );

// バージョン(上位4ビット)とバリアント(RFC 9562 の 10xx)を設定する
const setVersionAndVariant = (bytes: Uint8Array, version: number) => {
  bytes[6] = (bytes[6] & 0x0f) | (version << 4);
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
};

// UUID v4: 122ビットがランダム
export const uuidV4 = (randomBytes: RandomBytes = cryptoRandomBytes): string => {
  const bytes = randomBytes(16);
  setVersionAndVariant(bytes, 4);
  return withHyphens(toHex(bytes));
};

// UUID v7: 先頭48ビットがUnixミリ秒、残りがランダム。生成順に並ぶのでDBの主キーに向く
export const uuidV7 = (
  now: number = Date.now(),
  randomBytes: RandomBytes = cryptoRandomBytes
): string => {
  const bytes = randomBytes(16);
  let ms = now;
  for (let i = 5; i >= 0; i--) {
    bytes[i] = ms % 256;
    ms = Math.floor(ms / 256);
  }
  setVersionAndVariant(bytes, 7);
  return withHyphens(toHex(bytes));
};

export const formatUuid = (uuid: string, { uppercase = false, hyphens = true }: UuidFormat) => {
  const text = hyphens ? uuid : uuid.replace(/-/g, "");
  return uppercase ? text.toUpperCase() : text;
};

// 入力された個数を 1〜MAX_COUNT の整数にする(数値でなければ 1)
export const clampCount = (value: string): number => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_COUNT);
};

export const generateUuids = (
  version: UuidVersion,
  count: number,
  format: UuidFormat
): string[] => {
  const uuids = Array.from({ length: count }, () => (version === "v4" ? uuidV4() : uuidV7()));
  // 同じミリ秒に作った v7 は後ろのランダム部分で順序が決まるので、並べ替えて生成順を保つ
  if (version === "v7") uuids.sort();
  return uuids.map((uuid) => formatUuid(uuid, format));
};
