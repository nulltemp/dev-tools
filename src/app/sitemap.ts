import type { MetadataRoute } from "next";
import { SITE_URL, tools } from "./tools";

// output: "export" では静的生成を明示する必要がある
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...tools.map((tool) => ({
      url: `${SITE_URL}${tool.href}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
