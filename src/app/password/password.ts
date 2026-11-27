export type CharKind = "upper" | "lower" | "digits" | "symbols";

export const CHAR_KINDS: CharKind[] = ["upper", "lower", "digits", "symbols"];

export const CHARSETS: Record<CharKind, string> = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  // ASCII の印字可能な記号(空白を除く32文字)
  symbols: "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
};

// 見間違えやすい文字(0とO、1とlとIと| など)
export const AMBIGUOUS_CHARS = "0Oo1lI|";

export const MIN_LENGTH = 4;
export const MAX_LENGTH = 128;
export const MAX_COUNT = 100;

export interface PasswordOptions {
  length: number;
  kinds: CharKind[];
  excludeAmbiguous?: boolean;
  // 選んだ種類の文字をそれぞれ1文字以上含める
  requireEach?: boolean;
}

// テストで差し替えられるよう、乱数は引数で受け取る(0〜2^32-1 の一様な整数を返す)
export type RandomUint32 = () => number;

export const cryptoRandomUint32: RandomUint32 = () =>
  crypto.getRandomValues(new Uint32Array(1))[0];

const UINT32_RANGE = 2 ** 32;

// 0〜n-1 の一様な整数。剰余で丸めると小さい値に偏るので、端数の範囲に入った値は捨てて引き直す
export const randomIndex = (n: number, random: RandomUint32 = cryptoRandomUint32): number => {
  if (!Number.isInteger(n) || n < 1 || n > UINT32_RANGE) {
    throw new RangeError(`n must be an integer in 1..2^32: ${n}`);
  }
  const limit = UINT32_RANGE - (UINT32_RANGE % n);
  for (;;) {
    const x = random();
    if (x < limit) return x % n;
  }
};

// 種類ごとの文字集合(紛らわしい文字を除いたもの)。選ばれた種類の順で、空になった種類は含めない
export const buildCharsets = (kinds: CharKind[], excludeAmbiguous = false): string[] =>
  CHAR_KINDS.filter((kind) => kinds.includes(kind))
    .map((kind) =>
      excludeAmbiguous
        ? [...CHARSETS[kind]].filter((c) => !AMBIGUOUS_CHARS.includes(c)).join("")
        : CHARSETS[kind]
    )
    .filter((set) => set.length > 0);

export const generatePassword = (
  { length, kinds, excludeAmbiguous = false, requireEach = false }: PasswordOptions,
  random: RandomUint32 = cryptoRandomUint32
): string => {
  const sets = buildCharsets(kinds, excludeAmbiguous);
  if (sets.length === 0) throw new Error("文字の種類を1つ以上選んでください");
  const alphabet = sets.join("");
  const mustCheck = requireEach && length >= sets.length;
  // 必要な種類が欠けていたら全体を作り直す。特定の位置に差し込むと位置や文字が偏るため
  for (;;) {
    let password = "";
    for (let i = 0; i < length; i++) password += alphabet[randomIndex(alphabet.length, random)];
    if (!mustCheck || sets.every((set) => [...set].some((c) => password.includes(c)))) {
      return password;
    }
  }
};

export const generatePasswords = (
  options: PasswordOptions,
  count: number,
  random: RandomUint32 = cryptoRandomUint32
): string[] => Array.from({ length: count }, () => generatePassword(options, random));

// BigInt の正の整数の log2(上位53ビットで近似)
const log2BigInt = (n: bigint): number => {
  const bits = n.toString(2).length;
  if (bits <= 53) return Math.log2(Number(n));
  const shift = BigInt(bits - 53);
  return Math.log2(Number(n >> shift)) + Number(shift);
};

// 生成されうるパスワードの数の log2(ビット)。種類を必ず含める場合は、
// どれかの種類が欠けたものを包除原理で除いた数で数える
export const entropyBits = (options: PasswordOptions): number => {
  const sets = buildCharsets(options.kinds, options.excludeAmbiguous);
  if (sets.length === 0) return 0;
  const length = BigInt(options.length);
  const total = sets.reduce((sum, set) => sum + set.length, 0);
  if (!options.requireEach || options.length < sets.length) {
    return options.length * Math.log2(total);
  }
  let count = BigInt(0);
  for (let mask = 0; mask < 1 << sets.length; mask++) {
    let excluded = 0;
    let size = 0;
    sets.forEach((set, i) => {
      if (mask & (1 << i)) {
        excluded++;
        size += set.length;
      }
    });
    const term = BigInt(total - size) ** length;
    count += excluded % 2 === 0 ? term : -term;
  }
  return log2BigInt(count);
};

// 入力された数を min〜max の整数にする(数値でなければ fallback)
export const clampInt = (value: string, min: number, max: number, fallback = min): number => {
  if (value.trim() === "") return fallback;
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};
