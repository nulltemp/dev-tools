import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { lastModified, type Git } from "./lastModified";

// git log と git rev-parse の結果を差し替える
const fakeGit =
  (log: string, shallowFile = "/nonexistent/shallow"): Git =>
  (args) =>
    args[0] === "log" ? log : shallowFile;

describe("lastModified", () => {
  it("最後のコミットの日付を返す", () => {
    expect(lastModified(["src/app/uuid/"], fakeGit("abc123 2026-11-20"))).toBe("2026-11-20");
  });

  it("git log に対象のパスを渡す", () => {
    const calls: string[][] = [];
    lastModified(["src/app/page.tsx", "src/app/tools.ts"], (args) => {
      calls.push(args);
      return "abc123 2026-11-20";
    });
    expect(calls[0]).toEqual([
      "log",
      "-1",
      "--format=%H %cs",
      "--",
      "src/app/page.tsx",
      "src/app/tools.ts",
    ]);
  });

  it("履歴にないときは undefined を返す", () => {
    expect(lastModified(["missing/"], fakeGit(""))).toBeUndefined();
  });

  it("git が使えないときは undefined を返す", () => {
    const git: Git = () => {
      throw new Error("git: not found");
    };
    expect(lastModified(["src/app/uuid/"], git)).toBeUndefined();
  });

  it("浅いクローンの境界のコミットなら、本当の日付が分からないので undefined を返す", () => {
    const shallow = path.join(mkdtempSync(path.join(tmpdir(), "lastmod-")), "shallow");
    writeFileSync(shallow, "abc123\n");
    expect(lastModified(["src/app/uuid/"], fakeGit("abc123 2026-11-20", shallow))).toBeUndefined();
    expect(lastModified(["src/app/uuid/"], fakeGit("def456 2026-11-21", shallow))).toBe(
      "2026-11-21"
    );
  });
});
