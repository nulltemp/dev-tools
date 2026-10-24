import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { toolJsonLd, toolMetadata, tools } from "./tools";

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
    const metadata = toolMetadata("/json-formatter");
    expect(metadata.title).toBe("JSON整形");
    expect(metadata.description).toBe("JSONデータを整形して表示します");
  });

  it("canonical と OGP をツールのURLで設定する", () => {
    const metadata = toolMetadata("/json-formatter");
    expect(metadata.alternates?.canonical).toBe("/json-formatter");
    expect(metadata.openGraph).toMatchObject({
      url: "/json-formatter",
      title: "JSON整形 | デベロッパーツール",
      siteName: "デベロッパーツール",
    });
  });

  it("未登録のhrefはエラーにする", () => {
    expect(() => toolMetadata("/unknown")).toThrow("Unknown tool: /unknown");
  });
});

describe("toolJsonLd", () => {
  it("WebApplication の構造化データを返す", () => {
    expect(toolJsonLd("/jwt-decoder")).toMatchObject({
      "@type": "WebApplication",
      name: "JWTデコーダー",
      url: "https://dev-tools.nulltemp.com/jwt-decoder",
      applicationCategory: "DeveloperApplication",
    });
  });
});
