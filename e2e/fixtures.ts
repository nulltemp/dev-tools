import { test as base, expect, type Page } from "@playwright/test";

export { expect };

// 各テストで共通にすること:
// - テスト対象(localhost)以外への通信は止めて記録する。CI から Google Analytics に計測が送られるのを防ぎ、
//   「入力は送信されません」の確認にも使う
// - ページ内の JavaScript エラーや CSP 違反があればテストを失敗させる
// フィクスチャの第2引数は Playwright の慣例では use だが、React の use() と誤認されないよう run と呼ぶ
// pageErrors は意図的にエラーを起こすテストが確認後に空にできるよう公開している
export const test = base.extend<{ externalRequests: string[]; pageErrors: string[] }>({
  externalRequests: [
    async ({ page, baseURL }, run) => {
      const requests: string[] = [];
      const origin = new URL(baseURL!).origin;
      await page.route(
        (url) => url.origin !== origin,
        (route) => {
          requests.push(route.request().url());
          return route.abort();
        }
      );
      await run(requests);
    },
    // テストで使わなくても必ず有効にする
    { auto: true },
  ],
  pageErrors: async ({}, run) => {
    await run([]);
  },
  page: async ({ page, pageErrors: errors }, run) => {
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error" && message.text().includes("Content Security Policy")) {
        errors.push(message.text());
      }
    });
    await run(page);
    expect(errors, "ページで JavaScript エラーか CSP 違反が起きた").toEqual([]);
  },
});

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 900;

// 狭い画面ではサイドバーがメニューに入るので、開いてから使う
export const openNav = async (page: Page) => {
  if (isMobile(page)) {
    await page.getByRole("button", { name: "メニューを開く" }).click();
  }
  return page.getByRole("navigation", { name: "ツール" }).filter({ visible: true });
};

// ツールの結果(CodeBlock)を見出しから探す
export const resultBlock = (page: Page, title: string | RegExp) =>
  page.locator("section").filter({ has: page.getByRole("heading", { name: title }) });

// 項目名と値を並べた結果(<dl>)から、項目名に対応する値を返す
export const definition = (page: Page, term: string) =>
  page
    .locator("dt")
    .filter({ hasText: new RegExp(`^${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) })
    .locator("xpath=following-sibling::dd[1]");

// エラー表示(情報表示の Alert は除く)
export const errorAlert = (page: Page) => page.locator(".MuiAlert-colorError");
