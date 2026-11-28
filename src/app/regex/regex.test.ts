import { describe, expect, it } from "vitest";
import {
  compileRegex,
  findMatches,
  flagsError,
  normalizeFlags,
  replaceText,
  runRegex,
  splitByMatches,
  toggleFlags,
} from "./regex";

describe("normalizeFlags", () => {
  it("決まった順に並べ、重複を除く", () => {
    expect(normalizeFlags(["y", "i", "g", "i"])).toBe("giy");
  });
});

describe("compileRegex", () => {
  it("構文エラーをメッセージにして返す", () => {
    const result = compileRegex("(", "");
    expect(result.regex).toBeUndefined();
    expect(result.error).toMatch(/^正規表現が正しくありません\(.+\)。$/);
  });

  it("u と v を同時に指定すると、構文エラーではなくフラグの日本語のエラーにする", () => {
    expect(compileRegex("a", "guv").error).toBe("u と v のフラグは同時に使えません。");
  });
});

describe("flagsError", () => {
  it("正しいフラグなら undefined", () => {
    expect(flagsError("")).toBeUndefined();
    expect(flagsError("gimsuy")).toBeUndefined();
    expect(flagsError("gv")).toBeUndefined();
  });

  it("u と v の同時指定・未知のフラグ・重複をエラーにする", () => {
    expect(flagsError("uv")).toBe("u と v のフラグは同時に使えません。");
    expect(flagsError("gx")).toBe("使えないフラグがあります(x)。");
    expect(flagsError("gg")).toBe("フラグが重複しています(g)。");
  });
});

describe("toggleFlags", () => {
  it("u をオンにした状態で v を選ぶと u が外れる", () => {
    expect(toggleFlags(["g", "u"], ["g", "u", "v"])).toEqual(["g", "v"]);
  });

  it("v をオンにした状態で u を選ぶと v が外れる", () => {
    expect(toggleFlags(["v"], ["v", "u"])).toEqual(["u"]);
  });

  it("ほかのフラグの切り替えはそのまま", () => {
    expect(toggleFlags(["g", "u"], ["g", "u", "i"])).toEqual(["g", "u", "i"]);
    expect(toggleFlags(["g", "u"], ["g"])).toEqual(["g"]);
  });
});

describe("findMatches", () => {
  it("g があればすべての一致を位置とともに返す", () => {
    const { matches, truncated } = findMatches(/\d+/g, "a1 b22 c333");
    expect(truncated).toBe(false);
    expect(matches.map((m) => [m.index, m.end, m.text])).toEqual([
      [1, 2, "1"],
      [4, 6, "22"],
      [8, 11, "333"],
    ]);
  });

  it("g がなければ最初の1件だけ返す", () => {
    expect(findMatches(/\d+/, "1 2 3").matches).toHaveLength(1);
  });

  it("番号付きと名前付きのキャプチャグループを返す", () => {
    const regex = new RegExp("(?<year>\\d{4})-(\\d{2})(x)?", "g");
    const [m] = findMatches(regex, "2026-11").matches;
    expect(m.groups).toEqual([
      { label: "1", value: "2026" },
      { label: "2", value: "11" },
      { label: "3", value: undefined },
      { label: "<year>", value: "2026" },
    ]);
  });

  it("空文字に一致するパターンでも無限ループしない", () => {
    const { matches } = findMatches(/a*/g, "baa");
    expect(matches.map((m) => [m.index, m.text])).toEqual([
      [0, ""],
      [1, "aa"],
      [3, ""],
    ]);
  });

  it("u フラグではサロゲートペアの途中で止まらない", () => {
    const { matches } = findMatches(new RegExp("", "gu"), "😀");
    expect(matches.map((m) => m.index)).toEqual([0, 2]);
  });

  it("上限を超えたら打ち切る", () => {
    const { matches, truncated } = findMatches(/a/g, "aaaa", 3);
    expect(matches).toHaveLength(3);
    expect(truncated).toBe(true);
  });

  it("渡した正規表現の lastIndex を変えない", () => {
    const regex = /a/g;
    findMatches(regex, "aaa");
    expect(regex.lastIndex).toBe(0);
  });
});

describe("replaceText", () => {
  it("$1 と $<name> で置換する", () => {
    const regex = new RegExp("(?<y>\\d{4})-(\\d{2})", "g");
    expect(replaceText(regex, "2026-11, 2027-01", "$2/$<y>")).toBe("11/2026, 01/2027");
  });

  it("g がなければ最初の1件だけ置換する", () => {
    expect(replaceText(/a/, "aaa", "b")).toBe("baa");
  });
});

describe("runRegex", () => {
  it("一致と置換結果をまとめて返す", () => {
    expect(runRegex({ pattern: "o", flags: "g", text: "foo", replacement: "0" })).toEqual({
      matches: [
        { index: 1, end: 2, text: "o", groups: [] },
        { index: 2, end: 3, text: "o", groups: [] },
      ],
      truncated: false,
      replaced: "f00",
    });
  });

  it("置換文字列がなければ置換しない", () => {
    const result = runRegex({ pattern: "o", flags: "", text: "foo" });
    expect(result.error).toBeUndefined();
    expect(result).not.toHaveProperty("replaced", expect.anything());
  });

  it("構文エラーはエラーとして返す", () => {
    expect(runRegex({ pattern: "[", flags: "", text: "" }).error).toBeDefined();
  });
});

describe("splitByMatches", () => {
  it("一致と非一致に分け、空文字の一致は区切らない", () => {
    const text = "baab";
    const { matches } = findMatches(/a*/g, text);
    expect(splitByMatches(text, matches)).toEqual([
      { text: "b" },
      { text: "aa", match: 1 },
      { text: "b" },
    ]);
  });
});
