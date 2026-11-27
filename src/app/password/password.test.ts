import { describe, expect, it } from "vitest";
import {
  AMBIGUOUS_CHARS,
  buildCharsets,
  clampInt,
  entropyBits,
  generatePassword,
  generatePasswords,
  randomIndex,
} from "./password";

// 決まった値を順に返す乱数
const sequence = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("randomIndex", () => {
  it("端数の範囲に入った値は捨てて引き直す", () => {
    // n=3 のとき 2^32 - (2^32 % 3) = 4294967295 以上は捨てる
    expect(randomIndex(3, sequence(4294967295, 7))).toBe(1);
    expect(randomIndex(3, sequence(4294967294))).toBe(4294967294 % 3);
  });

  it("偏りなく 0〜n-1 を返す", () => {
    const counts = new Array(10).fill(0);
    for (let i = 0; i < 20000; i++) counts[randomIndex(10)]++;
    for (const c of counts) {
      expect(c).toBeGreaterThan(1700);
      expect(c).toBeLessThan(2300);
    }
  });

  it("範囲外の n はエラーにする", () => {
    expect(() => randomIndex(0)).toThrow(RangeError);
    expect(() => randomIndex(1.5)).toThrow(RangeError);
  });
});

describe("buildCharsets", () => {
  it("選んだ種類の文字集合を返す", () => {
    expect(buildCharsets(["digits", "upper"])).toEqual([
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      "0123456789",
    ]);
    expect(buildCharsets(["symbols"])[0]).toHaveLength(32);
  });

  it("紛らわしい文字を除ける", () => {
    const sets = buildCharsets(["upper", "lower", "digits", "symbols"], true);
    for (const c of AMBIGUOUS_CHARS) expect(sets.join("")).not.toContain(c);
    expect(sets[2]).toBe("23456789");
  });
});

describe("generatePassword", () => {
  it("指定した長さで、選んだ種類の文字だけを使う", () => {
    for (let i = 0; i < 50; i++) {
      const password = generatePassword({ length: 20, kinds: ["digits"] });
      expect(password).toMatch(/^[0-9]{20}$/);
    }
  });

  it("乱数で文字を選ぶ", () => {
    expect(generatePassword({ length: 4, kinds: ["digits"] }, sequence(0, 1, 2, 13))).toBe(
      "0123"
    );
  });

  it("種類を必ず含める場合は、欠けていれば全体を作り直す", () => {
    // 英大文字+数字(36文字)。1回目は "AAAA" で数字が欠けるので捨て、2回目の "A0A0" を返す
    const random = sequence(0, 0, 0, 0, 0, 26, 0, 26);
    expect(
      generatePassword({ length: 4, kinds: ["upper", "digits"], requireEach: true }, random)
    ).toBe("A0A0");
  });

  it("種類を必ず含める場合、すべての種類が入る", () => {
    for (let i = 0; i < 200; i++) {
      const password = generatePassword({
        length: 4,
        kinds: ["upper", "lower", "digits", "symbols"],
        requireEach: true,
      });
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[0-9]/);
      expect(password).toMatch(/[^A-Za-z0-9]/);
    }
  });

  it("種類が選ばれていなければエラーにする", () => {
    expect(() => generatePassword({ length: 8, kinds: [] })).toThrow();
  });
});

describe("generatePasswords", () => {
  it("指定した個数を生成する", () => {
    const passwords = generatePasswords({ length: 16, kinds: ["lower"] }, 5);
    expect(passwords).toHaveLength(5);
    expect(new Set(passwords).size).toBe(5);
  });
});

describe("entropyBits", () => {
  it("長さ × log2(文字の種類の数)になる", () => {
    expect(entropyBits({ length: 10, kinds: ["digits"] })).toBeCloseTo(10 * Math.log2(10));
    expect(entropyBits({ length: 16, kinds: ["upper", "lower", "digits", "symbols"] })).toBeCloseTo(
      16 * Math.log2(94)
    );
  });

  it("種類を必ず含める場合は、欠けたものを除いた数で数える", () => {
    // 英大文字+数字で2文字: 36^2 - 10^2 - 26^2 = 520 通り
    expect(entropyBits({ length: 2, kinds: ["upper", "digits"], requireEach: true })).toBeCloseTo(
      Math.log2(520)
    );
    const bits = entropyBits({
      length: 128,
      kinds: ["upper", "lower", "digits", "symbols"],
      requireEach: true,
    });
    expect(bits).toBeLessThan(128 * Math.log2(94));
    expect(bits).toBeGreaterThan(128 * Math.log2(94) - 0.001);
  });

  it("種類が選ばれていなければ 0", () => {
    expect(entropyBits({ length: 8, kinds: [] })).toBe(0);
  });
});

describe("clampInt", () => {
  it("min〜max の整数にする", () => {
    expect(clampInt("20", 4, 128)).toBe(20);
    expect(clampInt("2.7", 1, 100)).toBe(2);
    expect(clampInt("1", 4, 128)).toBe(4);
    expect(clampInt("1000", 4, 128)).toBe(128);
    expect(clampInt("abc", 4, 128, 16)).toBe(16);
    expect(clampInt("", 1, 100)).toBe(1);
  });
});
