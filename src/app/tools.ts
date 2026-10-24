import type { Metadata } from "next";

export const SITE_URL = "https://dev-tools.nulltemp.com";
export const SITE_NAME = "デベロッパーツール";
export const SITE_DESCRIPTION =
  "文字数カウンター、JSON整形、JWTデコーダーなど、開発に便利なツール集";

// 静的ホスティングで Content-Type が正しく付くよう拡張子付きの静的画像を使う
export const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: SITE_NAME,
};

export interface Tool {
  href: string;
  name: string;
  description: string;
}

// サイドバー・ホームのカード・各ページのメタデータ・サイトマップはこの一覧から生成する
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

const findTool = (href: string): Tool => {
  const tool = tools.find((t) => t.href === href);
  if (!tool) {
    throw new Error(`Unknown tool: ${href}`);
  }
  return tool;
};

// openGraph は親レイアウトとマージされず丸ごと置き換わるため、共通項目もここで指定する
export const toolMetadata = (href: string): Metadata => {
  const tool = findTool(href);
  const title = `${tool.name} | ${SITE_NAME}`;
  return {
    title: tool.name,
    description: tool.description,
    alternates: { canonical: href },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "ja_JP",
      url: href,
      title,
      description: tool.description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: tool.description,
    },
  };
};

export const toolJsonLd = (href: string) => {
  const tool = findTool(href);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.description,
    url: `${SITE_URL}${href}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    inLanguage: "ja",
    offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  };
};

export const siteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  inLanguage: "ja",
});
