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
    ["空文字", ""],
    ["末尾カンマ", '{"a":1,}'],
    ["シングルクォート", "{'a':1}"],
    ["閉じ括弧なし", '{"a":1'],
  ])("無効なJSON(%s)はエラーを返す", (_, input) => {
    expect(formatJson(input)).toEqual({ ok: false, error: "無効なJSONです" });
  });
});
