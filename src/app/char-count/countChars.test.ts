import { describe, expect, it } from "vitest";
import { countGraphemes } from "./countChars";

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
