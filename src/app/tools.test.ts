import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { toolMetadata, tools } from "./tools";

describe("tools", () => {
  it("hrefが重複していない", () => {
    const hrefs = tools.map((t) => t.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it.each(tools.map((t) => [t.href]))(
    "%s に page.tsx と layout.tsx が存在する",
    (href) => {
      const dir = path.join(__dirname, href);
      expect(existsSync(path.join(dir, "page.tsx"))).toBe(true);
      expect(existsSync(path.join(dir, "layout.tsx"))).toBe(true);
    }
  );
});

describe("toolMetadata", () => {
  it("ツールの名前と説明をメタデータとして返す", () => {
    expect(toolMetadata("/json-formatter")).toEqual({
      title: "JSON整形",
      description: "JSONデータを整形して表示します",
    });
  });

  it("未登録のhrefはエラーにする", () => {
    expect(() => toolMetadata("/unknown")).toThrow("Unknown tool: /unknown");
  });
});
