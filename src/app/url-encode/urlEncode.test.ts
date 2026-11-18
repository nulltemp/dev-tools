import { describe, expect, it } from "vitest";
import { decodeUrl, encodeUrl } from "./urlEncode";

describe("encodeUrl", () => {
  it("日本語と記号をパーセントエンコードする", () => {
    expect(encodeUrl("東京 a&b=c/d?")).toEqual({
      ok: true,
      text: "%E6%9D%B1%E4%BA%AC%20a%26b%3Dc%2Fd%3F",
    });
  });

  it("英数字と - _ . ~ はそのまま残す", () => {
    expect(encodeUrl("aZ09-_.~")).toEqual({ ok: true, text: "aZ09-_.~" });
  });

  it("フォーム形式ではスペースを + にする", () => {
    expect(encodeUrl("a b+c", { form: true })).toEqual({ ok: true, text: "a+b%2Bc" });
  });

  it("対になっていないサロゲートはエラーにする", () => {
    expect(encodeUrl("\ud83d")).toMatchObject({ ok: false });
  });
});

describe("decodeUrl", () => {
  it("パーセントエンコードを戻す", () => {
    expect(decodeUrl("%E6%9D%B1%E4%BA%AC%20a%26b")).toEqual({ ok: true, text: "東京 a&b" });
  });

  it("小文字の16進数も受け付ける", () => {
    expect(decodeUrl("%e6%9d%b1")).toEqual({ ok: true, text: "東" });
  });

  it("+ はフォーム形式のときだけスペースにする", () => {
    expect(decodeUrl("a+b%2Bc")).toEqual({ ok: true, text: "a+b+c" });
    expect(decodeUrl("a+b%2Bc", { form: true })).toEqual({ ok: true, text: "a b+c" });
  });

  it("% の後に16進数2桁がなければ位置を示す", () => {
    expect(decodeUrl("abc%zz")).toEqual({
      ok: false,
      error: "4文字目の「%」の後に2桁の16進数がありません",
    });
    expect(decodeUrl("100%")).toMatchObject({ ok: false });
  });

  it("UTF-8 として正しくないバイト列はエラーにする", () => {
    expect(decodeUrl("%E6%9D")).toEqual({
      ok: false,
      error: "UTF-8として正しくないバイト列が含まれています",
    });
  });
});
