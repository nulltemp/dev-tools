import type { MetadataRoute } from "next";
import { SITE_URL } from "./tools";

// output: "export" では静的生成を明示する必要がある
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
