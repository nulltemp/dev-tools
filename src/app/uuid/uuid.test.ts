import { describe, expect, it } from "vitest";
import { clampCount, formatUuid, generateUuids, MAX_COUNT, uuidV4, uuidV7 } from "./uuid";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-([0-9a-f])[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const fixedBytes = (value: number) => (length: number) => new Uint8Array(length).fill(value);

describe("uuidV4", () => {
  it("バージョン4・RFC 9562 のバリアントの形式になる", () => {
    for (let i = 0; i < 50; i++) {
      expect(uuidV4()).toMatch(UUID_PATTERN);
      expect(uuidV4()[14]).toBe("4");
    }
  });

  it("乱数のビットにバージョンとバリアントを上書きする", () => {
    expect(uuidV4(fixedBytes(0xff))).toBe("ffffffff-ffff-4fff-bfff-ffffffffffff");
    expect(uuidV4(fixedBytes(0))).toBe("00000000-0000-4000-8000-000000000000");
  });

  it("毎回違う値になる", () => {
    const set = new Set(Array.from({ length: 1000 }, () => uuidV4()));
    expect(set.size).toBe(1000);
  });
});

describe("uuidV7", () => {
  it("先頭48ビットがUnixミリ秒になる", () => {
    // RFC 9562 の例と同じ時刻 0x017F22E279B0
    const uuid = uuidV7(0x017f22e279b0, fixedBytes(0));
    expect(uuid).toBe("017f22e2-79b0-7000-8000-000000000000");
  });

  it("バージョン7・RFC 9562 のバリアントの形式になる", () => {
    const uuid = uuidV7();
    expect(uuid).toMatch(UUID_PATTERN);
    expect(uuid[14]).toBe("7");
  });

  it("時刻が後なら値も大きくなる", () => {
    expect(uuidV7(1000, fixedBytes(0xff)) < uuidV7(1001, fixedBytes(0))).toBe(true);
  });
});

describe("formatUuid", () => {
  const uuid = "017f22e2-79b0-7cc3-98c4-dc0c0c07398f";

  it("大文字にできる", () => {
    expect(formatUuid(uuid, { uppercase: true })).toBe("017F22E2-79B0-7CC3-98C4-DC0C0C07398F");
  });

  it("ハイフンを取り除ける", () => {
    expect(formatUuid(uuid, { hyphens: false })).toBe("017f22e279b07cc398c4dc0c0c07398f");
  });
});

describe("generateUuids", () => {
  it("指定した個数を生成する", () => {
    expect(generateUuids("v4", 5, {})).toHaveLength(5);
  });

  it("v7 は生成順(昇順)に並ぶ", () => {
    const uuids = generateUuids("v7", 50, {});
    expect(uuids).toEqual([...uuids].sort());
  });
});

describe("clampCount", () => {
  it("1〜上限の整数にする", () => {
    expect(clampCount("10")).toBe(10);
    expect(clampCount("2.7")).toBe(2);
    expect(clampCount("0")).toBe(1);
    expect(clampCount("-3")).toBe(1);
    expect(clampCount("abc")).toBe(1);
    expect(clampCount("")).toBe(1);
    expect(clampCount("100000")).toBe(MAX_COUNT);
  });
});
