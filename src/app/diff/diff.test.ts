import { describe, expect, it } from "vitest";
import {
  diffChars,
  diffLines,
  DiffTooLargeError,
  formatUnified,
  MAX_LINE_EDITS,
  MAX_LINES,
  splitLines,
  type DiffLine,
} from "./diff";

const summary = (lines: DiffLine[]) =>
  lines.map((l) => `${{ equal: " ", delete: "-", insert: "+" }[l.type]}${l.text}`);

describe("splitLines", () => {
  it("空文字列は0行", () => {
    expect(splitLines("")).toEqual([]);
  });

  it("CRLF・CR・LF で分け、末尾の改行は行を増やさない", () => {
    expect(splitLines("a\r\nb\rc\nd\n")).toEqual(["a", "b", "c", "d"]);
    expect(splitLines("a\n\n")).toEqual(["a", ""]);
  });
});

describe("diffLines", () => {
  it("両方とも空なら差分なし", () => {
    expect(diffLines("", "")).toEqual({ lines: [], added: 0, removed: 0, approximate: false });
  });

  it("同じテキストなら全行 equal で、行番号が付く", () => {
    const result = diffLines("a\nb", "a\nb");
    expect(result.added).toBe(0);
    expect(result.removed).toBe(0);
    expect(result.lines).toEqual([
      { type: "equal", text: "a", oldNo: 1, newNo: 1 },
      { type: "equal", text: "b", oldNo: 2, newNo: 2 },
    ]);
  });

  it("空から追加だけ", () => {
    const result = diffLines("", "a\nb");
    expect(summary(result.lines)).toEqual(["+a", "+b"]);
    expect(result.added).toBe(2);
    expect(result.lines[1].newNo).toBe(2);
  });

  it("削除だけ", () => {
    const result = diffLines("a\nb\nc", "a\nc");
    expect(summary(result.lines)).toEqual([" a", "-b", " c"]);
    expect(result.removed).toBe(1);
    expect(result.lines[2]).toMatchObject({ oldNo: 3, newNo: 2 });
  });

  it("途中への追加", () => {
    expect(summary(diffLines("a\nc", "a\nb\nc").lines)).toEqual([" a", "+b", " c"]);
  });

  it("最短の差分を求める", () => {
    const result = diffLines("a\nb\nc\na\nb\nb\na", "c\nb\na\nb\na\nc");
    expect(result.added + result.removed).toBe(5);
    // 変更前・変更後それぞれの行が順に復元できる
    const old = result.lines.filter((l) => l.type !== "insert").map((l) => l.text);
    const next = result.lines.filter((l) => l.type !== "delete").map((l) => l.text);
    expect(old).toEqual(["a", "b", "c", "a", "b", "b", "a"]);
    expect(next).toEqual(["c", "b", "a", "b", "a", "c"]);
  });

  it("改行コードの違い(CRLF と LF)と末尾の改行の有無は差分にしない", () => {
    const result = diffLines("a\r\nb\r\n", "a\nb");
    expect(result.added + result.removed).toBe(0);
  });

  it("空白の違いを無視できる", () => {
    expect(diffLines("a  b\n  c", "a b\nc").removed).toBe(2);
    expect(diffLines("a  b\n  c", "a b\nc", { ignoreWhitespace: true }).removed).toBe(0);
  });

  it("大文字・小文字の違いを無視できる", () => {
    expect(diffLines("Hello", "hello").removed).toBe(1);
    expect(diffLines("Hello", "hello", { ignoreCase: true }).lines).toEqual([
      { type: "equal", text: "Hello", oldNo: 1, newNo: 1 },
    ]);
  });

  it("変更された行には文字単位の差分が付く", () => {
    const [removed, added] = diffLines('"port": 8080', '"port": 8081').lines;
    expect(removed.segments).toEqual([
      { text: '"port": 808', changed: false },
      { text: "0", changed: true },
    ]);
    expect(added.segments).toEqual([
      { text: '"port": 808', changed: false },
      { text: "1", changed: true },
    ]);
  });

  it("組にならない追加・削除の行には文字単位の差分を付けない", () => {
    const lines = diffLines("a", "b\nc").lines;
    expect(lines[0].segments).toBeDefined();
    expect(lines[1].segments).toBeDefined();
    expect(lines[2].segments).toBeUndefined();
  });

  it("行数が上限を超えたらエラー", () => {
    const big = "x\n".repeat(MAX_LINES + 1);
    expect(() => diffLines(big, "")).toThrow(DiffTooLargeError);
  });

  it("編集距離が上限を超えたら全部削除・全部追加として返す", () => {
    const count = MAX_LINE_EDITS;
    const before = Array.from({ length: count }, (_, i) => `a${i}`).join("\n");
    const after = Array.from({ length: count }, (_, i) => `b${i}`).join("\n");
    const result = diffLines(`same\n${before}\nend`, `same\n${after}\nend`);
    expect(result.approximate).toBe(true);
    expect(result.removed).toBe(count);
    expect(result.added).toBe(count);
    expect(result.lines[0].type).toBe("equal");
    expect(result.lines[result.lines.length - 1]).toMatchObject({ type: "equal", text: "end" });
  });
});

describe("diffChars", () => {
  it("絵文字(サロゲートペア)を分けない", () => {
    expect(diffChars("a😀", "a😃")).toEqual({
      before: [
        { text: "a", changed: false },
        { text: "😀", changed: true },
      ],
      after: [
        { text: "a", changed: false },
        { text: "😃", changed: true },
      ],
    });
  });

  it("長すぎる行は比べない", () => {
    expect(diffChars("a".repeat(1001), "b")).toBeUndefined();
  });
});

describe("formatUnified", () => {
  it("差分がなければ空文字列", () => {
    expect(formatUnified(diffLines("a", "a").lines)).toBe("");
  });

  it("diff -u と同じ形式で、前後3行を含むハンクにする", () => {
    const before = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].join("\n");
    const after = ["1", "2", "3", "4", "five", "6", "7", "8", "9", "10", "11", "12", "13"].join(
      "\n"
    );
    expect(formatUnified(diffLines(before, after).lines)).toBe(
      [
        "--- before",
        "+++ after",
        "@@ -2,7 +2,7 @@",
        " 2",
        " 3",
        " 4",
        "-5",
        "+five",
        " 6",
        " 7",
        " 8",
        "@@ -10,3 +10,4 @@",
        " 10",
        " 11",
        " 12",
        "+13",
        "",
      ].join("\n")
    );
  });

  it("空のテキストとの差分は開始行を0にする", () => {
    expect(formatUnified(diffLines("", "a").lines)).toBe("--- before\n+++ after\n@@ -0,0 +1 @@\n+a\n");
    expect(formatUnified(diffLines("a\nb", "").lines)).toBe(
      "--- before\n+++ after\n@@ -1,2 +0,0 @@\n-a\n-b\n"
    );
  });
});
