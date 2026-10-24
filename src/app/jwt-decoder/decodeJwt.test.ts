import { describe, expect, it } from "vitest";
import { base64UrlDecode, decodeJwt } from "./decodeJwt";

const encode = (value: unknown): string =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

const makeJwt = (payload: unknown, header: unknown = { alg: "HS256", typ: "JWT" }) =>
  `${encode(header)}.${encode(payload)}.signature-part`;

const NOW = Date.UTC(2026, 0, 1); // 2026-01-01T00:00:00Z
const nowSec = NOW / 1000;

describe("base64UrlDecode", () => {
  it.each([
    ["パディングなし(余り2)", "YQ", "a"],
    ["パディングなし(余り3)", "YWI", "ab"],
    ["パディング不要", "YWJj", "abc"],
  ])("%s をデコードできる", (_, input, expected) => {
    expect(base64UrlDecode(input)).toBe(expected);
  });

  it("base64urlの - と _ を扱える", () => {
    // "?>?" を base64 にすると "Pz4/" になり、base64url では "Pz4_"
    expect(base64UrlDecode("Pz4_")).toBe("?>?");
    // "~~~" を base64 にすると "fn5+" になり、base64url では "fn5-"
    expect(base64UrlDecode("fn5-")).toBe("~~~");
  });

  it("UTF-8のマルチバイト文字をデコードできる", () => {
    const encoded = Buffer.from("日本語").toString("base64url");
    expect(base64UrlDecode(encoded)).toBe("日本語");
  });
});

describe("decodeJwt", () => {
  it("ヘッダーとペイロードを整形したJSONで返し、署名はそのまま返す", () => {
    const result = decodeJwt(makeJwt({ sub: "123", name: "太郎" }), NOW);
    expect(result).toEqual({
      ok: true,
      decoded: {
        header: '{\n  "alg": "HS256",\n  "typ": "JWT"\n}',
        payload: '{\n  "sub": "123",\n  "name": "太郎"\n}',
        signature: "signature-part",
        expiresAt: null,
        isExpired: false,
      },
    });
  });

  it("前後の空白や改行を無視する", () => {
    const result = decodeJwt(`\n  ${makeJwt({ sub: "1" })}  \n`, NOW);
    expect(result.ok).toBe(true);
  });

  it("expが未来なら期限切れではない", () => {
    const result = decodeJwt(makeJwt({ exp: nowSec + 60 }), NOW);
    expect(result.ok && result.decoded.expiresAt).toEqual(new Date(NOW + 60_000));
    expect(result.ok && result.decoded.isExpired).toBe(false);
  });

  it("expが過去なら期限切れ", () => {
    const result = decodeJwt(makeJwt({ exp: nowSec - 1 }), NOW);
    expect(result.ok && result.decoded.expiresAt).toEqual(new Date(NOW - 1000));
    expect(result.ok && result.decoded.isExpired).toBe(true);
  });

  it("expが数値でなければ有効期限なしとして扱う", () => {
    const result = decodeJwt(makeJwt({ exp: "1700000000" }), NOW);
    expect(result.ok && result.decoded.expiresAt).toBeNull();
    expect(result.ok && result.decoded.isExpired).toBe(false);
  });

  it("ペイロードがオブジェクトでなくてもデコードできる", () => {
    const result = decodeJwt(makeJwt(null), NOW);
    expect(result).toMatchObject({
      ok: true,
      decoded: { payload: "null", expiresAt: null },
    });
  });

  it.each([
    ["2部構成", "aaa.bbb"],
    ["4部構成", "a.b.c.d"],
    ["空文字", ""],
  ])("%sのトークンは形式エラーを返す", (_, input) => {
    expect(decodeJwt(input, NOW)).toEqual({
      ok: false,
      error:
        "無効なJWT形式です(header.payload.signatureの3部構成である必要があります)",
    });
  });

  it.each([
    ["base64として不正", "!!!.@@@.sig"],
    ["JSONではない", `${Buffer.from("not json").toString("base64url")}.${encode({})}.sig`],
  ])("ヘッダーやペイロードが%sな場合はデコードエラーを返す", (_, input) => {
    expect(decodeJwt(input, NOW)).toEqual({
      ok: false,
      error: "JWTのデコードに失敗しました",
    });
  });
});
