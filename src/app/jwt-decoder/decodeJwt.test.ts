import { describe, expect, it } from "vitest";
import {
  FORMAT_ERROR,
  JWE_ERROR,
  decodeBase64UrlSegment,
  decodeJwt,
  normalizeToken,
} from "./decodeJwt";

const encode = (value: unknown): string =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

const makeJwt = (payload: unknown, header: unknown = { alg: "HS256", typ: "JWT" }) =>
  `${encode(header)}.${encode(payload)}.signature-part`;

const NOW = Date.UTC(2026, 0, 1); // 2026-01-01T00:00:00Z
const nowSec = NOW / 1000;

describe("decodeBase64UrlSegment", () => {
  it.each([
    ["パディングなし(余り2)", "YQ", "a"],
    ["パディングなし(余り3)", "YWI", "ab"],
    ["パディング不要", "YWJj", "abc"],
  ])("%s をデコードできる", (_, input, expected) => {
    expect(decodeBase64UrlSegment(input)).toEqual({ ok: true, text: expected });
  });

  it("base64urlの - と _ を扱える", () => {
    // "?>?" を base64 にすると "Pz4/" になり、base64url では "Pz4_"
    expect(decodeBase64UrlSegment("Pz4_")).toEqual({ ok: true, text: "?>?" });
    // "~~~" を base64 にすると "fn5+" になり、base64url では "fn5-"
    expect(decodeBase64UrlSegment("fn5-")).toEqual({ ok: true, text: "~~~" });
  });

  it("UTF-8のマルチバイト文字をデコードできる", () => {
    const encoded = Buffer.from("日本語").toString("base64url");
    expect(decodeBase64UrlSegment(encoded)).toEqual({ ok: true, text: "日本語" });
  });

  it.each([
    ["空白", "e30 x", "Base64URLで使えない文字(空白)が含まれています"],
    ["改行", "e30\nx", "Base64URLで使えない文字(改行)が含まれています"],
    ["Base64の+", "e3+x", "Base64URLで使えない文字(「+」)が含まれています"],
    ["パディングの=", "YQ==", "「=」が含まれています(JWTのBase64URLではパディングの「=」を付けません)"],
  ])("%sを含むと失敗する", (_, input, reason) => {
    expect(decodeBase64UrlSegment(input)).toEqual({ ok: false, reason });
  });

  it("長さが4n+1(途中で切れている)だと失敗する", () => {
    expect(decodeBase64UrlSegment("e30xx")).toEqual({
      ok: false,
      reason: "Base64URLの長さが正しくありません(途中で切れている可能性があります)",
    });
  });

  it("不正なUTF-8を置換文字にせず失敗する", () => {
    const encoded = Buffer.from([0x22, 0xff, 0x22]).toString("base64url");
    expect(decodeBase64UrlSegment(encoded)).toEqual({
      ok: false,
      reason: "デコード結果がUTF-8のテキストではありません",
    });
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

  it("大きな整数・数値の表記・重複キーをトークンの中身のまま表示する", () => {
    const raw = '{"sub":12345678901234567890,"amount":1.0,"a":1,"a":2,"exp":1e10}';
    const payload = Buffer.from(raw).toString("base64url");
    const result = decodeJwt(`${encode({ alg: "HS256" })}.${payload}.sig`, NOW);
    expect(result).toMatchObject({
      ok: true,
      decoded: {
        header: '{\n  "alg": "HS256"\n}',
        payload:
          '{\n  "sub": 12345678901234567890,\n  "amount": 1.0,\n  "a": 1,\n  "a": 2,\n  "exp": 1e10\n}',
        // 期限の判定は値として読んだ数値を使う
        expiresAt: new Date(1e13),
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

  it("ヘッダーのBase64URLが不正ならヘッダーのエラーと分かる", () => {
    expect(decodeJwt("!!!.@@@.sig", NOW)).toEqual({
      ok: false,
      error: "ヘッダー: Base64URLで使えない文字(「!」)が含まれています",
    });
  });

  it("ペイロードに空白が入っていたら受け入れない", () => {
    expect(decodeJwt(`${encode({ alg: "HS256" })}.e30 .x`, NOW)).toEqual({
      ok: false,
      error: "ペイロード: Base64URLで使えない文字(空白)が含まれています",
    });
  });

  it("途中で切れたペイロードは長さのエラーを返す", () => {
    expect(decodeJwt(`${encode({ alg: "HS256" })}.e.x`, NOW)).toEqual({
      ok: false,
      error: "ペイロード: Base64URLの長さが正しくありません(途中で切れている可能性があります)",
    });
  });

  it("ペイロードが不正なUTF-8ならエラーを返す", () => {
    const payload = Buffer.from([0x7b, 0x22, 0x61, 0x22, 0x3a, 0x22, 0xff, 0x22, 0x7d]).toString("base64url");
    expect(decodeJwt(`${encode({ alg: "HS256" })}.${payload}.sig`, NOW)).toEqual({
      ok: false,
      error: "ペイロード: デコード結果がUTF-8のテキストではありません",
    });
  });

  it("JSONでなければ、どの部分の何文字目かを返す", () => {
    expect(decodeJwt(`${Buffer.from("not json").toString("base64url")}.${encode({})}.sig`, NOW)).toEqual({
      ok: false,
      error: "ヘッダー: JSONとして正しくありません(1行目1文字目: 「null」の綴りが正しくありません)",
    });
    expect(decodeJwt(`${encode({ alg: "HS256" })}.${Buffer.from('{"a":1,}').toString("base64url")}.sig`, NOW)).toEqual({
      ok: false,
      error: "ペイロード: JSONとして正しくありません(1行目7文字目: 最後の要素の後ろに余分なカンマがあります)",
    });
  });
});
