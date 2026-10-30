import { describe, expect, it } from "vitest";
import { formatJson } from "./formatJson";

describe("formatJson", () => {
  it("オブジェクトを2スペースインデントで整形する", () => {
    expect(formatJson('{"a":1,"b":[true,null]}')).toEqual({
      ok: true,
      formatted: '{\n  "a": 1,\n  "b": [\n    true,\n    null\n  ]\n}',
    });
  });

  it("前後の空白や改行を含む入力も整形できる", () => {
    expect(formatJson('  \n{"a":1}\n  ')).toEqual({
      ok: true,
      formatted: '{\n  "a": 1\n}',
    });
  });

  it("配列以外のトップレベル値(数値・文字列・null)も受け付ける", () => {
    expect(formatJson("42")).toEqual({ ok: true, formatted: "42" });
    expect(formatJson('"text"')).toEqual({ ok: true, formatted: '"text"' });
    expect(formatJson("null")).toEqual({ ok: true, formatted: "null" });
  });

  it("日本語をエスケープせずに出力する", () => {
    expect(formatJson('{"名前":"\u592a\u90ce"}')).toEqual({
      ok: true,
      formatted: '{\n  "名前": "太郎"\n}',
    });
  });

  it.each([
    ["大きな整数", "12345678901234567890"],
    ["小数点以下の0", "1.0"],
    ["指数表記", "1E+2"],
    ["エスケープされた日本語", '"\\u592a\\u90ce"'],
    ["エスケープされたスラッシュ", '"a\\/b"'],
  ])("%sの表記を変えない", (_, input) => {
    expect(formatJson(input)).toEqual({ ok: true, formatted: input });
  });

  it("キーの順序を変えない", () => {
    expect(formatJson('{"b":1,"2":2,"1":3}')).toEqual({
      ok: true,
      formatted: '{\n  "b": 1,\n  "2": 2,\n  "1": 3\n}',
    });
  });

  it("重複したキーを残す", () => {
    expect(formatJson('{"a":1,"a":2}')).toEqual({
      ok: true,
      formatted: '{\n  "a": 1,\n  "a": 2\n}',
    });
  });

  it("空のオブジェクトと配列は1行で出力する", () => {
    expect(formatJson('{"a":{ },"b":[\n]}')).toEqual({
      ok: true,
      formatted: '{\n  "a": {},\n  "b": []\n}',
    });
  });

  it("ネストした値を深さに応じてインデントする", () => {
    expect(formatJson('[{"a":[1,2]},3]')).toEqual({
      ok: true,
      formatted:
        '[\n  {\n    "a": [\n      1,\n      2\n    ]\n  },\n  3\n]',
    });
  });

  it("文字列の中の記号や空白、エスケープされた引用符はそのまま残す", () => {
    expect(formatJson('{"a b":"{[,:]} \\"x\\" \\\\"}')).toEqual({
      ok: true,
      formatted: '{\n  "a b": "{[,:]} \\"x\\" \\\\"\n}',
    });
  });

  it("空白の入り方が違っても同じ結果になる", () => {
    const compact = formatJson('{"a":[1,{"b":null}]}');
    const spaced = formatJson('{ "a" :\r\n\t[ 1 , { "b" : null } ] }\n');
    expect(spaced).toEqual(compact);
  });

  it.each([
    ["空文字", ""],
    ["末尾カンマ", '{"a":1,}'],
    ["シングルクォート", "{'a':1}"],
    ["閉じ括弧なし", '{"a":1'],
  ])("無効なJSON(%s)はエラーを返す", (_, input) => {
    expect(formatJson(input)).toEqual({ ok: false, error: "無効なJSONです" });
  });
});
