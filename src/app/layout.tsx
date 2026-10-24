import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Roboto } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import "./globals.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "デベロッパーツール",
  description:
    "文字数カウンター、JSON整形、JWTデコーダーなど、開発に便利なツール集",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <div style={{ display: "flex" }}>
              <aside className="sidebar">
                <h3>ツール</h3>
                <nav>
                  <ul className="sidebar-nav">
                    <li>
                      <Link href="/char-count">文字数カウンター</Link>
                    </li>
                    <li>
                      <Link href="/json-formatter">JSON整形</Link>
                    </li>
                    <li>
                      <Link href="/jwt-decoder">JWTデコーダー</Link>
                    </li>
                  </ul>
                </nav>
              </aside>
              <main style={{ flex: 1, padding: "2rem", marginLeft: "200px" }}>
                {children}
              </main>
            </div>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
