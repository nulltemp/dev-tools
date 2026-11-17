import { describe, expect, it } from "vitest";
import {
  DECODE_ERROR,
  FORMAT_ERROR,
  JWE_ERROR,
  base64UrlDecode,
  decodeJwt,
  normalizeToken,
} from "./decodeJwt";

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

describe("normalizeToken", () => {
  it("トークンの途中にあるBearerは取り除かない", () => {
    expect(normalizeToken("abc.Bearer x.def")).toBe("abc.Bearer x.def");
  });

  it("Bearerだけの入力は空文字になる", () => {
    expect(normalizeToken("Bearer ")).toBe("");
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
        notBefore: null,
        issuedAt: null,
        isExpired: false,
        isNotYetValid: false,
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

  it("expが現在時刻ちょうどなら期限切れ(RFC 7519)", () => {
    const result = decodeJwt(makeJwt({ exp: nowSec }), NOW);
    expect(result.ok && result.decoded.expiresAt).toEqual(new Date(NOW));
    expect(result.ok && result.decoded.isExpired).toBe(true);
  });

  it.each([
    ["極端に大きい", "1e20", false],
    ["Infinityになるほど大きい", "1e400", false],
    ["極端に小さい", "-1e20", true],
  ])("expが%s値ならInvalid Dateにせず、期限切れかどうかは判定する", (_, exp, expired) => {
    // JSON.stringify では 1e400 を表せないので、ペイロードを直接組み立てる
    const payload = Buffer.from(`{"exp":${exp}}`).toString("base64url");
    const result = decodeJwt(`${encode({ alg: "HS256" })}.${payload}.sig`, NOW);
    expect(result.ok && result.decoded.expiresAt).toBeNull();
    expect(result.ok && result.decoded.isExpired).toBe(expired);
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
    expect(decodeJwt(input, NOW)).toEqual({ ok: false, error: FORMAT_ERROR });
  });

  it("5部構成のトークン(JWE)には専用のエラーを返す", () => {
    expect(decodeJwt("a.b.c.d.e", NOW)).toEqual({ ok: false, error: JWE_ERROR });
  });

  it.each([
    ["Bearer ", "Bearer "],
    ["小文字のbearer", "bearer "],
    ["前後の空白付き", "  Bearer   "],
  ])("先頭の%sを取り除いてデコードする", (_, prefix) => {
    const result = decodeJwt(`${prefix}${makeJwt({ sub: "1" })}`, NOW);
    expect(result.ok).toBe(true);
  });

  it("iatとnbfを日時として返す", () => {
    const result = decodeJwt(makeJwt({ iat: nowSec - 60, nbf: nowSec - 30 }), NOW);
    expect(result).toMatchObject({
      ok: true,
      decoded: {
        issuedAt: new Date(NOW - 60_000),
        notBefore: new Date(NOW - 30_000),
        isNotYetValid: false,
      },
    });
  });

  it("nbfが未来ならまだ有効でない", () => {
    const result = decodeJwt(makeJwt({ nbf: nowSec + 1 }), NOW);
    expect(result.ok && result.decoded.isNotYetValid).toBe(true);
  });

  it("nbfが現在時刻ちょうどなら有効(RFC 7519)", () => {
    const result = decodeJwt(makeJwt({ nbf: nowSec }), NOW);
    expect(result.ok && result.decoded.isNotYetValid).toBe(false);
  });

  it.each([
    ["base64として不正", "!!!.@@@.sig"],
    ["JSONではない", `${Buffer.from("not json").toString("base64url")}.${encode({})}.sig`],
  ])("ヘッダーやペイロードが%sな場合はデコードエラーを返す", (_, input) => {
    expect(decodeJwt(input, NOW)).toEqual({ ok: false, error: DECODE_ERROR });
  });
});
