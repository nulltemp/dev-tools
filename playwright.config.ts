import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

// 本番と同じ静的エクスポート(out/)を配信して確かめる。先に npm run build が必要
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // 日時の表示を環境によらず一定にする
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    trace: process.env.CI ? "retain-on-failure" : "off",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run start",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
