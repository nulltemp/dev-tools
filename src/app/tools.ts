import type { Metadata } from "next";

export interface Tool {
  href: string;
  name: string;
  description: string;
}

// サイドバー・ホームのカード・各ページのメタデータはこの一覧から生成する
export const tools: Tool[] = [
  {
    href: "/char-count",
    name: "文字数カウンター",
    description: "テキストの文字数をカウントします",
  },
  {
    href: "/json-formatter",
    name: "JSON整形",
    description: "JSONデータを整形して表示します",
  },
  {
    href: "/jwt-decoder",
    name: "JWTデコーダー",
    description: "JWTのヘッダーとペイロードをデコードして表示します",
  },
];

export const toolMetadata = (href: string): Metadata => {
  const tool = tools.find((t) => t.href === href);
  if (!tool) {
    throw new Error(`Unknown tool: ${href}`);
  }
  return { title: tool.name, description: tool.description };
};
