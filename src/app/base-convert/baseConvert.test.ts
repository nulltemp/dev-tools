import { describe, expect, it } from "vitest";
import { formatInteger, groupDigits, parseInteger } from "./baseConvert";

const value = (input: string, base: 2 | 8 | 10 | 16) => {
  const result = parseInteger(input, base);
  if (!result?.ok) throw new Error(`parse failed: ${JSON.stringify(result)}`);
  return result.value;
};

const error = (input: string, base: 2 | 8 | 10 | 16) => {
  const result = parseInteger(input, base);
  if (!result || result.ok) throw new Error(`expected an error: ${JSON.stringify(result)}`);
  return result.error;
};

describe("parseInteger", () => {
  it("空の入力は null", () => {
    expect(parseInteger("", 10)).toBeNull();
    expect(parseInteger("  \n ", 16)).toBeNull();
  });

  it("0 を読む", () => {
    expect(value("0", 10)).toBe(BigInt(0));
    expect(value("-0", 2)).toBe(BigInt(0));
    expect(value("0x0", 16)).toBe(BigInt(0));
  });

  it("各進数を読む(16進数は大文字・小文字とも)", () => {
    expect(value("1010", 2)).toBe(BigInt(10));
    expect(value("777", 8)).toBe(BigInt(511));
    expect(value("255", 10)).toBe(BigInt(255));
    expect(value("fF", 16)).toBe(BigInt(255));
  });

  it("負の数と + 符号", () => {
    expect(value("-255", 10)).toBe(-BigInt(255));
    expect(value("- 0xff", 16)).toBe(-BigInt(255));
    expect(value("+10", 2)).toBe(BigInt(2));
  });

  it("2^64 を超える値も精度を落とさない", () => {
    expect(value("18446744073709551617", 10)).toBe(BigInt(2) ** BigInt(64) + BigInt(1));
    expect(value("1" + "0".repeat(100), 2)).toBe(BigInt(2) ** BigInt(100));
    expect(formatInteger(BigInt(2) ** BigInt(64) + BigInt(1), 16)).toBe("10000000000000001");
  });

  it("選んだ進数と一致する接頭辞を受け付ける", () => {
    expect(value("0x1F", 16)).toBe(BigInt(31));
    expect(value("0X1f", 16)).toBe(BigInt(31));
    expect(value("0b101", 2)).toBe(BigInt(5));
    expect(value("0o17", 8)).toBe(BigInt(15));
  });

  it("16進数では 0b… を数字として読む", () => {
    expect(value("0b1", 16)).toBe(BigInt(0xb1));
  });

  it("一致しない接頭辞はエラーにする", () => {
    expect(error("0x1F", 10)).toBe(
      "1文字目の接頭辞「0x」は16進数のものです。入力の進数を16進数にしてください"
    );
    expect(error("-0b1", 8)).toContain("2文字目の接頭辞「0b」は2進数のもの");
    expect(error("0o7", 16)).toContain("8進数のもの");
  });

  it("「_」と空白を桁区切りとして無視する", () => {
    expect(value("1_000_000", 10)).toBe(BigInt(1000000));
    expect(value(" 1010 0101 ", 2)).toBe(BigInt(0b10100101));
    expect(value("0xdead_beef", 16)).toBe(BigInt(0xdeadbeef));
  });

  it("その進数で使えない文字の位置(1始まり)を伝える", () => {
    expect(error("1012", 2)).toBe("4文字目の「2」は2進数の数字として使えません");
    expect(error("78", 8)).toBe("2文字目の「8」は8進数の数字として使えません");
    expect(error("12a", 10)).toBe("3文字目の「a」は10進数の数字として使えません");
    expect(error("0xfg", 16)).toBe("4文字目の「g」は16進数の数字として使えません");
    expect(error("1.5", 10)).toContain("2文字目の「.」");
    expect(error("--1", 10)).toContain("2文字目の「-」");
    // 絵文字(サロゲートペア)も1文字と数える
    expect(error("😀1x", 10)).toContain("1文字目の「😀」");
    expect(error("1😀x", 10)).toContain("2文字目");
  });

  it("数字がなければエラー", () => {
    expect(error("-", 10)).toBe("数字がありません");
    expect(error("0x", 16)).toBe("数字がありません");
    expect(error("__", 10)).toBe("数字がありません");
  });
});

describe("formatInteger", () => {
  it("各進数で表す", () => {
    expect(formatInteger(BigInt(255), 2)).toBe("11111111");
    expect(formatInteger(BigInt(255), 8)).toBe("377");
    expect(formatInteger(-BigInt(255), 10)).toBe("-255");
    expect(formatInteger(BigInt(255), 16)).toBe("ff");
    expect(formatInteger(BigInt(255), 16, { uppercaseHex: true })).toBe("FF");
  });

  it("2進数を4桁ごとに区切る", () => {
    expect(formatInteger(BigInt(22), 2, { groupBinary: true })).toBe("1 0110");
    expect(formatInteger(-BigInt(255), 2, { groupBinary: true })).toBe("-1111 1111");
    expect(formatInteger(BigInt(0), 2, { groupBinary: true })).toBe("0");
  });
});

describe("groupDigits", () => {
  it("右から区切る", () => {
    expect(groupDigits("1234567", 3)).toBe("1 234 567");
    expect(groupDigits("1234")).toBe("1234");
  });
});
