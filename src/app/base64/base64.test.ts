import { describe, expect, it } from "vitest";
import {
  decodeBase64,
  downloadFileName,
  encodeBase64,
  encodeBase64Bytes,
  hexDump,
  isPreviewableImage,
  sniffMimeType,
  toDataUrl,
} from "./base64";

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

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
    expect(decodeBase64(encodeBase64(text))).toMatchObject({ ok: true, text });
  });
});

describe("decodeBase64", () => {
  it("UTF-8 のテキストにデコードする", () => {
    expect(decodeBase64("5pel5pys6Kqe")).toMatchObject({ ok: true, text: "日本語" });
  });

  it("= の省略と URLセーフの文字を受け付ける", () => {
    expect(decodeBase64("8J-RjQ")).toMatchObject({ ok: true, text: "👍" });
    expect(decodeBase64("Pz8_")).toMatchObject({ ok: true, text: "???" });
  });

  it("空白・改行を無視する", () => {
    expect(decodeBase64("  aGVs\nbG8=\n")).toMatchObject({ ok: true, text: "hello" });
  });

  it("data URL の前置きを取り除く", () => {
    expect(decodeBase64("data:text/plain;base64,aGVsbG8=")).toMatchObject({
      ok: true,
      text: "hello",
    });
  });

  it("使えない文字があればその文字を示す", () => {
    expect(decodeBase64("aGVs*bG8=")).toMatchObject({
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

describe("decodeBase64 のバイナリ", () => {
  it("UTF-8 として読めないときもバイト列を返す", () => {
    const result = decodeBase64("//4A");
    expect(result.ok).toBe(false);
    expect(result.bytes).toEqual(new Uint8Array([0xff, 0xfe, 0x00]));
    expect(result.mimeType).toBeUndefined();
  });

  it("data URL の MIME タイプを返す(パラメーターは除く)", () => {
    expect(decodeBase64("data:Image/PNG;name=a.png;base64,iVBORw0KGgo=")).toMatchObject({
      ok: false,
      mimeType: "image/png",
      bytes: new Uint8Array(PNG_HEADER),
    });
    expect(decodeBase64("data:text/plain;charset=utf-8;base64,aGVsbG8=")).toMatchObject({
      ok: true,
      text: "hello",
      mimeType: "text/plain",
    });
  });

  it("data URL でなければ先頭のバイト列から MIME タイプを推測する", () => {
    expect(decodeBase64("iVBORw0KGgo=")).toMatchObject({ mimeType: "image/png" });
  });

  it("Base64 として不正ならバイト列は返さない", () => {
    expect(decodeBase64("aGVs*")).not.toHaveProperty("bytes");
  });
});

describe("encodeBase64Bytes と toDataUrl", () => {
  it("0xFF などを含むバイト列をエンコードし、デコードで戻せる", () => {
    const bytes = new Uint8Array([0x00, 0xff, 0xfe, 0x80, 0x7f]);
    expect(encodeBase64Bytes(bytes)).toBe("AP/+gH8=");
    expect(encodeBase64Bytes(bytes, { urlSafe: true })).toBe("AP_-gH8");
    expect(decodeBase64(encodeBase64Bytes(bytes)).bytes).toEqual(bytes);
  });

  it("全256種類のバイトを往復できる", () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);
    expect(decodeBase64(encodeBase64Bytes(bytes)).bytes).toEqual(bytes);
  });

  it("data URL にする。MIME が空なら application/octet-stream", () => {
    expect(toDataUrl(new Uint8Array(PNG_HEADER), "image/png")).toBe(
      "data:image/png;base64,iVBORw0KGgo="
    );
    expect(toDataUrl(new Uint8Array([1, 2, 3]), "")).toBe(
      "data:application/octet-stream;base64,AQID"
    );
  });
});

describe("バイナリの表示用の関数", () => {
  it("マジックナンバーから MIME タイプを判別する", () => {
    expect(sniffMimeType(new Uint8Array(PNG_HEADER))).toBe("image/png");
    expect(sniffMimeType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffMimeType(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(sniffMimeType(new TextEncoder().encode("%PDF-1.7"))).toBe("application/pdf");
    expect(sniffMimeType(new Uint8Array([0x89, 0x50]))).toBeUndefined();
  });

  it("16進ダンプは1行16バイトで、上限までにする", () => {
    const bytes = Uint8Array.from({ length: 20 }, (_, i) => i);
    expect(hexDump(bytes)).toBe(
      "00000000  00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f\n00000010  10 11 12 13"
    );
    expect(hexDump(bytes, 4)).toBe("00000000  00 01 02 03");
    expect(hexDump(new Uint8Array())).toBe("");
  });

  it("保存するファイル名の拡張子を MIME から決める", () => {
    expect(downloadFileName("image/png")).toBe("decoded.png");
    expect(downloadFileName("application/x-unknown")).toBe("decoded.bin");
    expect(downloadFileName(undefined)).toBe("decoded.bin");
  });

  it("画像の MIME だけプレビューする", () => {
    expect(isPreviewableImage("image/png")).toBe(true);
    expect(isPreviewableImage("image/svg+xml")).toBe(true);
    expect(isPreviewableImage("text/html")).toBe(false);
    expect(isPreviewableImage(undefined)).toBe(false);
  });
});
