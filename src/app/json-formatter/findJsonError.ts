export interface JsonErrorLocation {
  // 1始まりの行番号と、その行の何文字目か
  line: number;
  column: number;
  message: string;
}

class JsonSyntaxError extends Error {
  constructor(
    readonly position: number,
    message: string
  ) {
    super(message);
  }
}

const WHITESPACE = new Set([" ", "\t", "\n", "\r"]);
const SIMPLE_ESCAPES = new Set(['"', "\\", "/", "b", "f", "n", "r", "t"]);
const isDigit = (char: string | undefined) =>
  char !== undefined && char >= "0" && char <= "9";
const isHexDigit = (char: string | undefined) =>
  char !== undefined && /^[0-9a-fA-F]$/.test(char);

// 位置を人が数える「行・文字」に直す。サロゲートペアの絵文字なども1文字と数える
const toLocation = (input: string, position: number) => {
  const before = input.slice(0, position);
  const lines = before.split(/\r\n|\r|\n/);
  return {
    line: lines.length,
    column: Array.from(lines[lines.length - 1]).length + 1,
  };
};

// JSON.parse のエラーはブラウザごとに文言が違い位置も分からないことがあるため、
// 構文を自前でたどって最初のエラーの位置と理由を返す。有効な JSON なら null
export const findJsonError = (input: string): JsonErrorLocation | null => {
  let i = 0;

  const fail = (message: string): never => {
    throw new JsonSyntaxError(i, message);
  };

  const unexpected = (): never => {
    if (i >= input.length) fail("JSONが途中で終わっています");
    const char = Array.from(input.slice(i))[0];
    if (char === "'") fail("文字列はダブルクォート(\")で囲む必要があります");
    if (char === "\n" || char === "\r") fail("予期しない改行があります");
    if (WHITESPACE.has(char)) fail("予期しない空白があります");
    return fail(`予期しない文字「${char}」があります`);
  };

  const skipWhitespace = () => {
    while (WHITESPACE.has(input[i])) i++;
  };

  const expect = (char: string) => {
    if (input[i] !== char) unexpected();
    i++;
  };

  const parseString = () => {
    i++; // 開きの "
    while (true) {
      if (i >= input.length) fail("文字列が閉じられていません");
      const char = input[i];
      if (char === '"') {
        i++;
        return;
      }
      if (char < " ") fail("文字列の中に改行などの制御文字があります");
      if (char === "\\") {
        const next = input[i + 1];
        if (SIMPLE_ESCAPES.has(next)) {
          i += 2;
        } else if (next === "u") {
          for (let k = 2; k < 6; k++) {
            if (!isHexDigit(input[i + k])) {
              fail("\\u の後には16進数4桁が必要です");
            }
          }
          i += 6;
        } else {
          fail("無効なエスケープシーケンスです");
        }
      } else {
        i++;
      }
    }
  };

  const parseDigits = () => {
    if (!isDigit(input[i])) unexpected();
    while (isDigit(input[i])) i++;
  };

  const parseNumber = () => {
    if (input[i] === "-") i++;
    if (input[i] === "0") {
      i++;
      if (isDigit(input[i])) fail("数値の先頭に0は付けられません");
    } else {
      parseDigits();
    }
    if (input[i] === ".") {
      i++;
      parseDigits();
    }
    if (input[i] === "e" || input[i] === "E") {
      i++;
      if (input[i] === "+" || input[i] === "-") i++;
      parseDigits();
    }
  };

  const parseLiteral = (word: string) => {
    if (input.startsWith(word, i)) {
      i += word.length;
      return;
    }
    fail(`「${word}」の綴りが正しくありません`);
  };

  // closing は ] か }。カンマの直後に閉じ括弧が来たら末尾カンマとして、カンマの位置を知らせる
  const failIfTrailingComma = (closing: string, commaPosition: number) => {
    if (input[i] === closing) {
      i = commaPosition;
      fail("最後の要素の後ろに余分なカンマがあります");
    }
  };

  const parseObject = () => {
    i++; // {
    skipWhitespace();
    if (input[i] === "}") {
      i++;
      return;
    }
    while (true) {
      if (input[i] !== '"') {
        if (input[i] === "'" || i >= input.length) unexpected();
        fail("キーはダブルクォート(\")で囲んだ文字列にする必要があります");
      }
      parseString();
      skipWhitespace();
      expect(":");
      skipWhitespace();
      parseValue();
      skipWhitespace();
      if (input[i] === "}") {
        i++;
        return;
      }
      if (input[i] !== ",") {
        if (i >= input.length) unexpected();
        fail("カンマ(,)か閉じ括弧(})が必要です");
      }
      const commaPosition = i;
      i++;
      skipWhitespace();
      failIfTrailingComma("}", commaPosition);
    }
  };

  const parseArray = () => {
    i++; // [
    skipWhitespace();
    if (input[i] === "]") {
      i++;
      return;
    }
    while (true) {
      parseValue();
      skipWhitespace();
      if (input[i] === "]") {
        i++;
        return;
      }
      if (input[i] !== ",") {
        if (i >= input.length) unexpected();
        fail("カンマ(,)か閉じ括弧(])が必要です");
      }
      const commaPosition = i;
      i++;
      skipWhitespace();
      failIfTrailingComma("]", commaPosition);
    }
  };

  const parseValue = () => {
    const char = input[i];
    if (char === "{") parseObject();
    else if (char === "[") parseArray();
    else if (char === '"') parseString();
    else if (char === "-" || isDigit(char)) parseNumber();
    else if (char === "t") parseLiteral("true");
    else if (char === "f") parseLiteral("false");
    else if (char === "n") parseLiteral("null");
    else unexpected();
  };

  try {
    skipWhitespace();
    if (i >= input.length) fail("JSONが入力されていません");
    parseValue();
    skipWhitespace();
    if (i < input.length) fail("JSONの後ろに余分な文字があります");
    return null;
  } catch (e) {
    if (!(e instanceof JsonSyntaxError)) throw e;
    return { ...toLocation(input, e.position), message: e.message };
  }
};
