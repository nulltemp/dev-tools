export const BASES = [2, 8, 10, 16] as const;
export type Base = (typeof BASES)[number];

export const BASE_NAMES: Record<Base, string> = {
  2: "2進数",
  8: "8進数",
  10: "10進数",
  16: "16進数",
};

const PREFIX_BASES: Record<string, Base> = { "0b": 2, "0o": 8, "0x": 16 };

export type ParseResult = { ok: true; value: bigint } | { ok: false; error: string };

const isSeparator = (char: string) => char === "_" || /\s/.test(char);

// 入力を指定した進数の整数として読む。空(空白だけ)なら null。
// - 先頭の「-」「+」で符号を付けられる
// - 0x・0b・0o の接頭辞は、選んだ進数と一致するときだけ受け付ける(大文字の 0X なども可)。
//   16進数では 0b… は数字(0xB…)として読む。一致しない接頭辞はエラーにして、どの進数用かを伝える
// - 「_」と空白は桁区切りとして無視する
// - エラーの位置は、元の入力での1始まりの文字位置
// 数値は BigInt で扱うので、桁数が多くても精度は落ちない
export const parseInteger = (input: string, base: Base): ParseResult | null => {
  const chars = Array.from(input);
  let i = 0;
  const skipSeparators = () => {
    while (i < chars.length && /\s/.test(chars[i])) i++;
  };

  skipSeparators();
  if (i === chars.length) return null;

  let negative = false;
  if (chars[i] === "-" || chars[i] === "+") {
    negative = chars[i] === "-";
    i++;
    skipSeparators();
  }

  const prefix = chars.slice(i, i + 2).join("").toLowerCase();
  const prefixBase = PREFIX_BASES[prefix];
  if (prefixBase !== undefined && !(base === 16 && prefix === "0b")) {
    if (prefixBase !== base) {
      return {
        ok: false,
        error: `${i + 1}文字目の接頭辞「${chars.slice(i, i + 2).join("")}」は${BASE_NAMES[prefixBase]}のものです。入力の進数を${BASE_NAMES[prefixBase]}にしてください`,
      };
    }
    i += 2;
  }

  let digits = "";
  for (; i < chars.length; i++) {
    const char = chars[i];
    if (isSeparator(char)) continue;
    const digit = parseInt(char, 36);
    if (Number.isNaN(digit) || digit >= base || char.length !== 1) {
      return {
        ok: false,
        error: `${i + 1}文字目の「${char}」は${BASE_NAMES[base]}の数字として使えません`,
      };
    }
    digits += char.toLowerCase();
  }

  if (digits === "") {
    return { ok: false, error: "数字がありません" };
  }

  const prefixForBigInt = { 2: "0b", 8: "0o", 10: "", 16: "0x" }[base];
  const value = BigInt(prefixForBigInt + digits);
  return { ok: true, value: negative ? -value : value };
};

// 4桁ごとに右から空白で区切る(2進数の表示用)
export const groupDigits = (digits: string, size = 4): string => {
  const sign = digits.startsWith("-") ? "-" : "";
  const body = sign ? digits.slice(1) : digits;
  const groups: string[] = [];
  for (let end = body.length; end > 0; end -= size) {
    groups.unshift(body.slice(Math.max(0, end - size), end));
  }
  return sign + groups.join(" ");
};

export interface FormatOptions {
  groupBinary?: boolean;
  uppercaseHex?: boolean;
}

export const formatInteger = (
  value: bigint,
  base: Base,
  { groupBinary = false, uppercaseHex = false }: FormatOptions = {}
): string => {
  const text = value.toString(base);
  if (base === 2 && groupBinary) return groupDigits(text);
  if (base === 16 && uppercaseHex) return text.toUpperCase();
  return text;
};
