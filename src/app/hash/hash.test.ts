import { describe, expect, it, vi } from "vitest";
import {
  digest,
  findMatchingAlgorithm,
  formatDigest,
  hashAll,
  hashErrorMessage,
  hmac,
  isWebCryptoAvailable,
  toBase64,
  toHex,
} from "./hash";

describe("digest", () => {
  it("空文字列の既知の値になる", async () => {
    expect(toHex(await digest("SHA-1", ""))).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
    expect(toHex(await digest("SHA-256", ""))).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });

  it("abc の既知の値になる(FIPS 180 のテストベクタ)", async () => {
    expect(toHex(await digest("SHA-1", "abc"))).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
    expect(toHex(await digest("SHA-256", "abc"))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
    expect(toHex(await digest("SHA-384", "abc"))).toBe(
      "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7"
    );
    expect(toHex(await digest("SHA-512", "abc"))).toBe(
      "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f"
    );
  });

  it("テキストを UTF-8 としてハッシュする", async () => {
    // printf 'あ' | sha256sum
    expect(toHex(await digest("SHA-256", "あ"))).toBe(
      "dc5a4d3d82f7e15792959dc661538ae0e541ce66494516f5c9cfd9cd3308494d"
    );
  });
});

describe("バイト列のハッシュ", () => {
  it("空のバイト列は空文字列と同じ値になる", async () => {
    expect(toHex(await digest("SHA-256", new Uint8Array()))).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });

  it("abc のバイト列は abc と同じ値になる", async () => {
    const bytes = new Uint8Array([0x61, 0x62, 0x63]);
    expect(toHex(await digest("SHA-1", bytes))).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
    expect(toHex(await digest("SHA-256", bytes))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });

  it("UTF-8 にならないバイト列もそのままハッシュする", async () => {
    // printf '\x00\xff' | sha256sum
    expect(toHex(await digest("SHA-256", new Uint8Array([0x00, 0xff])))).toBe(
      "06eb7d6a69ee19e5fbdf749018d3d2abfa04bcbd1365db312eb86dc7169389b8"
    );
  });

  it("バイト列の HMAC と hashAll", async () => {
    const data = new TextEncoder().encode("what do ya want for nothing?");
    expect(toHex(await hmac("SHA-256", "Jefe", data))).toBe(
      "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843"
    );
    const result = await hashAll(new Uint8Array([0x61, 0x62, 0x63]));
    expect(toHex(result["SHA-512"])).toBe(
      "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f"
    );
  });
});

describe("findMatchingAlgorithm", () => {
  it("16進は大文字・小文字と空白を無視し、Base64 はそのまま比べる", async () => {
    const digests = await hashAll("abc");
    expect(
      findMatchingAlgorithm(
        "  BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD\n",
        digests
      )
    ).toBe("SHA-256");
    expect(findMatchingAlgorithm("a9993e364706816aba3e25717850c26c9cd0d89d", digests)).toBe(
      "SHA-1"
    );
    expect(findMatchingAlgorithm("ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=", digests)).toBe(
      "SHA-256"
    );
    expect(findMatchingAlgorithm("UNGWV48BZ+PBQUDEXA4II7ADYAOWF3QCTBD/YFIAFA0=", digests)).toBe(
      undefined
    );
    expect(findMatchingAlgorithm("deadbeef", digests)).toBe(undefined);
    expect(findMatchingAlgorithm("  ", digests)).toBe(undefined);
  });
});

describe("hmac", () => {
  it("RFC 4231 のテストケース2になる", async () => {
    expect(toHex(await hmac("SHA-256", "Jefe", "what do ya want for nothing?"))).toBe(
      "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843"
    );
  });
});

describe("空の HMAC 鍵", () => {
  it("Web Crypto が長さ0の鍵を拒否する(画面では計算せず案内を出す)", async () => {
    await expect(hmac("SHA-256", "", "abc")).rejects.toThrow();
  });
});

describe("hashErrorMessage", () => {
  it("Web Crypto が使えるときは非対応とは言わない", () => {
    expect(isWebCryptoAvailable()).toBe(true);
    const message = hashErrorMessage(new Error("boom"));
    expect(message).not.toContain("Web Crypto に対応していない");
    expect(message).toContain("boom");
  });

  it("Web Crypto が使えないときは非対応の可能性を伝える", () => {
    vi.stubGlobal("crypto", {});
    try {
      expect(isWebCryptoAvailable()).toBe(false);
      expect(hashErrorMessage(new Error("boom"))).toContain("Web Crypto に対応していない");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("hashAll", () => {
  it("4つのアルゴリズムの結果を返す", async () => {
    const result = await hashAll("abc");
    expect(Object.keys(result)).toEqual(["SHA-1", "SHA-256", "SHA-384", "SHA-512"]);
    expect(result["SHA-512"]).toHaveLength(64);
  });

  it("key を渡すと HMAC になる", async () => {
    const result = await hashAll("what do ya want for nothing?", "Jefe");
    expect(toHex(result["SHA-256"])).toBe(
      "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843"
    );
  });
});

describe("formatDigest", () => {
  const bytes = new Uint8Array([0x00, 0xab, 0xff, 0x10]);

  it("16進の小文字・大文字にする", () => {
    expect(formatDigest(bytes, "hex")).toBe("00abff10");
    expect(formatDigest(bytes, "HEX")).toBe("00ABFF10");
  });

  it("Base64 にする", () => {
    expect(formatDigest(bytes, "base64")).toBe("AKv/EA==");
    expect(toBase64(new Uint8Array())).toBe("");
  });
});
