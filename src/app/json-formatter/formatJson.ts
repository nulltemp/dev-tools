import { findJsonError } from "./findJsonError";

export type FormatJsonResult =
  | { ok: true; formatted: string }
  | { ok: false; error: string };

// 整形に使えるインデント
export const INDENTS = {
  "2": "  ",
  "4": "    ",
  tab: "\t",
} as const;
export type IndentKey = keyof typeof INDENTS;

const WHITESPACE = new Set([" ", "\t", "\n", "\r"]);

// 文字列リテラルの閉じる " の位置を返す(input は検証済みの JSON であること)
const findStringEnd = (input: string, start: number): number => {
  let i = start + 1;
  while (input[i] !== '"') {
    i += input[i] === "\\" ? 2 : 1;
  }
  return i;
};

// 値を解釈すると大きな数値の桁や数値の表記、キーの順序や重複が変わってしまうため、
// 元のテキストを保ったまま空白だけを整える(input は検証済みの JSON であること)。
// indent が null なら改行・インデントを入れずに圧縮する
const reindent = (input: string, indent: string | null): string => {
  const lineBreak = (depth: number) => (indent === null ? "" : `\n${indent.repeat(depth)}`);
  let output = "";
  let depth = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (WHITESPACE.has(char)) continue;

    if (char === '"') {
      const end = findStringEnd(input, i);
      output += input.slice(i, end + 1);
      i = end;
    } else if (char === "{" || char === "[") {
      let next = i + 1;
      while (WHITESPACE.has(input[next])) next++;
      if (input[next] === "}" || input[next] === "]") {
        output += char + input[next];
        i = next;
      } else {
        depth++;
        output += char + lineBreak(depth);
      }
    } else if (char === "}" || char === "]") {
      depth--;
      output += lineBreak(depth) + char;
    } else if (char === ",") {
      output += char + lineBreak(depth);
    } else if (char === ":") {
      output += indent === null ? ":" : ": ";
    } else {
      output += char;
    }
  }
  return output;
};

const transformJson = (input: string, indent: string | null): FormatJsonResult => {
  try {
    JSON.parse(input);
  } catch {
    const location = findJsonError(input);
    return {
      ok: false,
      // JSON.parse と判定が食い違った場合に備え、位置が分からなくてもエラーは返す
      error: location
        ? `無効なJSONです(${location.line}行目 ${location.column}文字目): ${location.message}`
        : "無効なJSONです",
    };
  }
  return { ok: true, formatted: reindent(input, indent) };
};

export const formatJson = (input: string, indent: IndentKey = "2"): FormatJsonResult =>
  transformJson(input, INDENTS[indent]);

export const minifyJson = (input: string): FormatJsonResult => transformJson(input, null);
