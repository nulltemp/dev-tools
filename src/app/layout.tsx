import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { Roboto } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import { tools } from "./tools";
import "./globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: {
    default: "デベロッパーツール",
    template: "%s | デベロッパーツール",
  },
  description:
    "文字数カウンター、JSON整形、JWTデコーダーなど、開発に便利なツール集",
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
              </aside>
              <main className="app-content">
                {children}
              </main>
            </div>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
