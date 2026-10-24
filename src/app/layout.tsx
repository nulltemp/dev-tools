import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { Roboto } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import {
  OG_IMAGE,
  PRIVACY_POLICY_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  tools,
} from "./tools";
import "./globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ja_JP",
    url: "/",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={roboto.variable}>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <div className="app-shell">
              <aside className="sidebar">
                <h2 className="sidebar-title">ツール</h2>
                <nav>
                  <ul className="sidebar-nav">
                    {tools.map((tool) => (
                      <li key={tool.href}>
                        <Link href={tool.href}>{tool.name}</Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                <footer className="sidebar-footer">
                  <a href={PRIVACY_POLICY_URL}>プライバシーポリシー</a>
                </footer>
              </aside>
              <main className="app-content">
                {children}
              </main>
            </div>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
      {/* 本番ビルドでのみ .env.production から設定される */}
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
