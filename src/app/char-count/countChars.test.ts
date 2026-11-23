import { describe, expect, it } from "vitest";
import {
  countGraphemes,
  countGraphemesWithoutWhitespace,
  countLines,
  countUtf8Bytes,
} from "./countChars";

describe("countGraphemes", () => {
  it("空文字は0文字", () => {
    expect(countGraphemes("")).toBe(0);
  });

  it("ASCIIと日本語を1文字ずつ数える", () => {
    expect(countGraphemes("abc")).toBe(3);
    expect(countGraphemes("こんにちは")).toBe(5);
  });

  it("サロゲートペアの漢字を1文字として数える", () => {
    expect(countGraphemes("𠮷野家")).toBe(3);
  });

  it("ZWJで結合された絵文字を1文字として数える", () => {
    expect(countGraphemes("👨‍👩‍👧")).toBe(1);
  });

  it("国旗の絵文字を1文字として数える", () => {
    expect(countGraphemes("🇯🇵")).toBe(1);
  });

  it("結合文字(か+濁点)を1文字として数える", () => {
    expect(countGraphemes("が")).toBe(1);
  });

  it("改行を1文字として数える", () => {
    expect(countGraphemes("abc\ndef")).toBe(7);
    expect(countGraphemes("abc\r\ndef")).toBe(7);
  });
});

describe("countGraphemesWithoutWhitespace", () => {
  it("半角・全角スペース、タブ、改行を除いて数える", () => {
    expect(countGraphemesWithoutWhitespace("a b　c\td\r\ne\n")).toBe(5);
  });

  it("空白だけなら0文字", () => {
    expect(countGraphemesWithoutWhitespace(" \n\t")).toBe(0);
  });

  it("絵文字は1文字として数える", () => {
    expect(countGraphemesWithoutWhitespace("👨‍👩‍👧 🇯🇵")).toBe(2);
  });
});

describe("countLines", () => {
  it("空文字は0行", () => {
    expect(countLines("")).toBe(0);
  });

  it("改行がなければ1行", () => {
    expect(countLines("abc")).toBe(1);
  });

  it("LF・CRLF・CR をそれぞれ1つの改行として数える", () => {
    expect(countLines("a\nb\r\nc\rd")).toBe(4);
  });

  it("末尾の改行の後も1行と数える", () => {
    expect(countLines("a\n")).toBe(2);
  });
});

describe("countUtf8Bytes", () => {
  it("空文字は0バイト", () => {
    expect(countUtf8Bytes("")).toBe(0);
  });

  it("ASCIIは1バイト、日本語は3バイト、サロゲートペアは4バイト", () => {
    expect(countUtf8Bytes("a")).toBe(1);
    expect(countUtf8Bytes("あ")).toBe(3);
    expect(countUtf8Bytes("𠮷")).toBe(4);
  });

  it("改行もバイト数に含める", () => {
    expect(countUtf8Bytes("a\r\nb")).toBe(4);
  });
});
