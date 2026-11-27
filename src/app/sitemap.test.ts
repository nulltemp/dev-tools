import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";
import { SITE_URL, tools } from "./tools";

describe("sitemap", () => {
  it("ホームと全ツールの URL を含む", () => {
    expect(sitemap().map((entry) => entry.url)).toEqual([
      SITE_URL,
      ...tools.map((tool) => `${SITE_URL}${tool.href}`),
    ]);
  });

  it("lastModified は分かるときだけ YYYY-MM-DD で入る", () => {
    for (const entry of sitemap()) {
      if (entry.lastModified !== undefined) {
        expect(entry.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});
