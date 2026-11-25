import { describe, expect, it } from "vitest";
import {
  formatDateTime,
  formatIso,
  formatOffset,
  formatRelative,
  parseDateTime,
  parseTimestamp,
} from "./timestamp";

const TOKYO = "Asia/Tokyo";
const NEW_YORK = "America/New_York";
const UTC = "UTC";

describe("parseTimestamp", () => {
  it.each([
    ["秒", "1700000000", "seconds", 1700000000000],
    ["ミリ秒", "1700000000123", "milliseconds", 1700000000123],
    ["0", "0", "seconds", 0],
    ["負の秒", "-86400", "seconds", -86400000],
    ["小数の秒", "1700000000.5", "seconds", 1700000000500],
    ["前後の空白", "  1700000000\n", "seconds", 1700000000000],
    ["マイクロ秒", "1700000000123456", "microseconds", 1700000000123],
    ["ナノ秒", "1700000000123456789", "nanoseconds", 1700000000123],
    ["負のマイクロ秒", "-1700000000000001", "microseconds", -1700000000001],
  ])("自動のとき%sとして解釈する", (_, input, unit, ms) => {
    expect(parseTimestamp(input)).toEqual({ ok: true, unit, date: new Date(ms) });
  });

  it("単位を指定すると桁数に関係なくその単位で解釈する", () => {
    expect(parseTimestamp("1700000000", "milliseconds")).toEqual({
      ok: true,
      unit: "milliseconds",
      date: new Date(1700000000),
    });
    expect(parseTimestamp("9000000000000", "seconds")).toEqual({
      ok: false,
      error: "日時として表せる範囲を超えています",
    });
  });

  it("マイクロ秒・ナノ秒も単位を指定して解釈できる", () => {
    expect(parseTimestamp("1700000000", "microseconds")).toEqual({
      ok: true,
      unit: "microseconds",
      date: new Date(1700000),
    });
    expect(parseTimestamp("1700000000000", "nanoseconds")).toEqual({
      ok: true,
      unit: "nanoseconds",
      date: new Date(1700000),
    });
  });

  it("ナノ秒の19桁を精度を落とさずに扱う", () => {
    // Number にすると 1700000000123456800 に丸まる値
    expect(parseTimestamp("1700000000123999999")).toMatchObject({
      date: new Date(1700000000123),
    });
  });

  it("ミリ秒未満は過去方向へ切り捨てる", () => {
    expect(parseTimestamp("-0.0005", "seconds")).toMatchObject({
      date: new Date(-1),
    });
  });

  it.each([["空文字", ""], ["文字", "abc"], ["指数表記", "1e9"], ["カンマ区切り", "1,700"]])(
    "%sはエラーを返す",
    (_, input) => {
      expect(parseTimestamp(input)).toEqual({
        ok: false,
        error: "数値(例: 1700000000)を入力してください",
      });
    }
  );

  it("Date で表せる上限ちょうどは受け付け、それを超えるとエラー", () => {
    expect(parseTimestamp("8640000000000000", "milliseconds").ok).toBe(true);
    expect(parseTimestamp("8640000000000001", "milliseconds").ok).toBe(false);
    expect(parseTimestamp("8640000000000000.5", "milliseconds").ok).toBe(false);
    expect(parseTimestamp("8640000000000000000000", "nanoseconds").ok).toBe(true);
    expect(parseTimestamp("8640000000000000000001", "nanoseconds").ok).toBe(false);
  });
});

describe("formatDateTime / formatIso / formatOffset", () => {
  const date = new Date(Date.UTC(2026, 10, 17, 3, 4, 5));

  it("タイムゾーンごとの日時を返す", () => {
    expect(formatDateTime(date, UTC)).toBe("2026-11-17 03:04:05");
    expect(formatDateTime(date, TOKYO)).toBe("2026-11-17 12:04:05");
    expect(formatDateTime(date, NEW_YORK)).toBe("2026-11-16 22:04:05");
  });

  it("0時を24時と表示しない", () => {
    expect(formatDateTime(new Date(Date.UTC(2026, 0, 1, 15)), TOKYO)).toBe(
      "2026-01-02 00:00:00"
    );
  });

  it("ミリ秒があるときだけ表示する", () => {
    expect(formatDateTime(new Date(1700000000123), UTC)).toBe(
      "2023-11-14 22:13:20.123"
    );
  });

  it("ISO 8601 形式で、UTC は Z を付ける", () => {
    expect(formatIso(date, UTC)).toBe("2026-11-17T03:04:05Z");
    expect(formatIso(date, TOKYO)).toBe("2026-11-17T12:04:05+09:00");
    expect(formatIso(date, NEW_YORK)).toBe("2026-11-16T22:04:05-05:00");
  });

  it("夏時間のオフセットを反映する", () => {
    expect(formatOffset(new Date(Date.UTC(2026, 6, 1)), NEW_YORK)).toBe("-04:00");
    expect(formatOffset(new Date(Date.UTC(2026, 0, 1)), NEW_YORK)).toBe("-05:00");
  });

  it("30分単位のオフセットも表示する", () => {
    expect(formatOffset(date, "Asia/Kolkata")).toBe("+05:30");
  });

  it("4桁を超える年や紀元前も表示できる", () => {
    expect(formatDateTime(new Date(8.64e15), UTC)).toBe("+275760-09-13 00:00:00");
    expect(formatDateTime(new Date(-8.64e15), UTC)).toBe("-271821-04-20 00:00:00");
  });
});

describe("formatRelative", () => {
  const now = Date.UTC(2026, 10, 17);

  it.each([
    [0, "0秒後"],
    [-30_000, "30秒前"],
    [-59 * 60_000, "59分前"],
    [-3 * 3600_000, "3時間前"],
    [2 * 86400_000, "2日後"],
    [-45 * 86400_000, "1か月前"],
    [3 * 365 * 86400_000, "3年後"],
  ])("%iミリ秒の差を「%s」と表示する", (diff, expected) => {
    expect(formatRelative(new Date(now + diff), now)).toBe(expected);
  });
});

describe("parseDateTime", () => {
  it.each([
    ["時刻なし", "2026-11-17", Date.UTC(2026, 10, 16, 15)],
    ["スラッシュ区切り", "2026/11/17 12:34", Date.UTC(2026, 10, 17, 3, 34)],
    ["1桁の月日と時", "2026-1-2 3:04:05", Date.UTC(2026, 0, 1, 18, 4, 5)],
    ["Tで区切った秒とミリ秒", "2026-11-17T12:34:56.7", Date.UTC(2026, 10, 17, 3, 34, 56, 700)],
  ])("%sの日時を指定したタイムゾーンで解釈する", (_, input, ms) => {
    expect(parseDateTime(input, TOKYO)).toEqual({ ok: true, date: new Date(ms) });
  });

  it.each([
    ["Z", "2026-11-17T12:00:00Z", Date.UTC(2026, 10, 17, 12)],
    ["+09:00", "2026-11-17T12:00:00+09:00", Date.UTC(2026, 10, 17, 3)],
    ["-0530", "2026-11-17 12:00 -0530", Date.UTC(2026, 10, 17, 17, 30)],
  ])("オフセット(%s)があればタイムゾーンより優先する", (_, input, ms) => {
    expect(parseDateTime(input, TOKYO)).toEqual({ ok: true, date: new Date(ms) });
  });

  it.each([
    ["Python の isoformat(マイクロ秒)", "2026-11-17T12:00:00.123456+00:00", Date.UTC(2026, 10, 17, 12, 0, 0, 123)],
    ["Go の RFC3339Nano(ナノ秒)", "2026-11-17T12:00:00.123456789Z", Date.UTC(2026, 10, 17, 12, 0, 0, 123)],
    ["PostgreSQL の timestamptz(時だけのオフセット)", "2026-11-17 12:00:00.123456+09", Date.UTC(2026, 10, 17, 3, 0, 0, 123)],
    ["時だけの負のオフセット", "2026-11-17T12:00-05", Date.UTC(2026, 10, 17, 17)],
    ["コロンなしのオフセット", "2026-11-17T12:00+0930", Date.UTC(2026, 10, 17, 2, 30)],
  ])("%s を読める(ミリ秒未満は切り捨て)", (_, input, ms) => {
    expect(parseDateTime(input, TOKYO)).toEqual({ ok: true, date: new Date(ms) });
  });

  it("小数秒が4桁以上でもオフセットがなければタイムゾーンで解釈する", () => {
    expect(parseDateTime("2026-11-17 12:00:00.9999", TOKYO)).toEqual({
      ok: true,
      date: new Date(Date.UTC(2026, 10, 17, 3, 0, 0, 999)),
    });
  });

  it("夏時間の切り替えで存在しない時刻はエラーにする", () => {
    expect(parseDateTime("2026-03-08 02:30", NEW_YORK)).toEqual({
      ok: false,
      error: "夏時間の切り替えで存在しない時刻です",
    });
    // 直前・直後の時刻は読める
    expect(parseDateTime("2026-03-08 01:59", NEW_YORK)).toEqual({
      ok: true,
      date: new Date(Date.UTC(2026, 2, 8, 6, 59)),
    });
    expect(parseDateTime("2026-03-08 03:00", NEW_YORK)).toEqual({
      ok: true,
      date: new Date(Date.UTC(2026, 2, 8, 7)),
    });
    // オフセットを付ければ現地時刻にない値でも読める
    expect(parseDateTime("2026-03-08 02:30-05:00", NEW_YORK).ok).toBe(true);
  });

  it("夏時間が終わるときに2回ある時刻は読める", () => {
    expect(parseDateTime("2026-11-01 01:30", NEW_YORK).ok).toBe(true);
  });

  it("夏時間の期間はそのオフセットで解釈する", () => {
    expect(parseDateTime("2026-07-01 12:00", NEW_YORK)).toEqual({
      ok: true,
      date: new Date(Date.UTC(2026, 6, 1, 16)),
    });
    expect(parseDateTime("2026-01-01 12:00", NEW_YORK)).toEqual({
      ok: true,
      date: new Date(Date.UTC(2026, 0, 1, 17)),
    });
  });

  it("UTCとして解釈できる", () => {
    expect(parseDateTime("1970-01-01 00:00:00", UTC)).toEqual({
      ok: true,
      date: new Date(0),
    });
  });

  it.each([
    ["2月30日", "2026-02-30"],
    ["13月", "2026-13-01"],
    ["24時", "2026-11-17 24:00"],
    ["60分", "2026-11-17 12:60"],
  ])("存在しない日時(%s)はエラーを返す", (_, input) => {
    expect(parseDateTime(input, TOKYO)).toEqual({
      ok: false,
      error: "存在しない日時です",
    });
  });

  it.each([
    ["分が60以上", "2026-11-17 12:00:00+09:75"],
    ["時が24以上", "2026-11-17 12:00:00+99:00"],
    ["コロンなしで分が60以上", "2026-11-17 12:00:00-0060"],
  ])("存在しないオフセット(%s)はエラーを返す", (_, input) => {
    expect(parseDateTime(input, UTC)).toEqual({
      ok: false,
      error: "存在しないオフセットです",
    });
  });

  it("うるう年の2月29日は受け付ける", () => {
    expect(parseDateTime("2028-02-29", UTC).ok).toBe(true);
  });

  it.each([["空文字", ""], ["文字", "明日"], ["年が2桁", "26-11-17"]])(
    "%sは形式エラーを返す",
    (_, input) => {
      expect(parseDateTime(input, TOKYO)).toEqual({
        ok: false,
        error: "日時は「2026-11-17 12:34:56」の形式で入力してください",
      });
    }
  );
});
