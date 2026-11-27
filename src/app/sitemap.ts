import type { MetadataRoute } from "next";
import { lastModified } from "./lastModified";
import { SITE_URL, tools } from "./tools";

// output: "export" では静的生成を明示する必要がある
export const dynamic = "force-static";

// ホームの内容(説明・カードの一覧)を決めるファイル
const HOME_SOURCES = ["src/app/page.tsx", "src/app/tools.ts"];

// ツールのページの内容を決めるファイル(使い方・用語の解説は toolGuides.ts にまとめてあるので含めない)
const toolSources = (href: string) => [`src/app${href}/`];

// lastModified が分からない(git がない・浅いクローン)ときは <lastmod> を出さない
const withLastModified = (entry: MetadataRoute.Sitemap[number], paths: string[]) => {
  const date = lastModified(paths);
  return date ? { ...entry, lastModified: date } : entry;
};

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    withLastModified({ url: SITE_URL, changeFrequency: "weekly", priority: 1 }, HOME_SOURCES),
    ...tools.map((tool) =>
      withLastModified(
        { url: `${SITE_URL}${tool.href}`, changeFrequency: "monthly", priority: 0.8 },
        toolSources(tool.href)
      )
    ),
  ];
}
