import { describe, expect, it } from "vitest";
import { decodeBase64, encodeBase64 } from "./base64";

describe("encodeBase64", () => {
  it("ASCII をエンコードする", () => {
    expect(encodeBase64("hello")).toBe("aGVsbG8=");
  });

  it("日本語や絵文字を UTF-8 としてエンコードする", () => {
    expect(encodeBase64("日本語")).toBe("5pel5pys6Kqe");
    expect(encodeBase64("👍")).toBe("8J+RjQ==");
  });

  it("空文字は空文字になる", () => {
    expect(encodeBase64("")).toBe("");
  });

  it("URLセーフでは + / を - _ にし、= を付けない", () => {
    // "??>" は通常の Base64 で "Pz8+"、"???" は "Pz8/"
    expect(encodeBase64("??>")).toBe("Pz8+");
    expect(encodeBase64("??>", { urlSafe: true })).toBe("Pz8-");
    expect(encodeBase64("???", { urlSafe: true })).toBe("Pz8_");
    expect(encodeBase64("👍", { urlSafe: true })).toBe("8J-RjQ");
  });

  it("大きな入力もエンコードできる", () => {
    const text = "あ".repeat(100000);
    expect(decodeBase64(encodeBase64(text))).toEqual({ ok: true, text });
  });
});

describe("decodeBase64", () => {
  it("UTF-8 のテキストにデコードする", () => {
    expect(decodeBase64("5pel5pys6Kqe")).toEqual({ ok: true, text: "日本語" });
  });

  it("= の省略と URLセーフの文字を受け付ける", () => {
    expect(decodeBase64("8J-RjQ")).toEqual({ ok: true, text: "👍" });
    expect(decodeBase64("Pz8_")).toEqual({ ok: true, text: "???" });
  });

  it("空白・改行を無視する", () => {
    expect(decodeBase64("  aGVs\nbG8=\n")).toEqual({ ok: true, text: "hello" });
  });

  it("data URL の前置きを取り除く", () => {
    expect(decodeBase64("data:text/plain;base64,aGVsbG8=")).toEqual({
      ok: true,
      text: "hello",
    });
  });

  it("使えない文字があればその文字を示す", () => {
    expect(decodeBase64("aGVs*bG8=")).toEqual({
      ok: false,
      error: "Base64で使えない文字「*」が含まれています",
    });
  });

  it("途中の = はエラーにする", () => {
    expect(decodeBase64("aG=Vs")).toMatchObject({ ok: false, error: "「=」は末尾にだけ置けます" });
  });

  it("ありえない長さはエラーにする", () => {
    expect(decodeBase64("aGVsb")).toMatchObject({ ok: false });
  });

  it("UTF-8 として読めないバイト列はエラーにする", () => {
    // 0xff 0xfe
    expect(decodeBase64("//4=")).toMatchObject({ ok: false });
  });
});
