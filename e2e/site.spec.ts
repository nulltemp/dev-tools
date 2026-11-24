import { GITHUB_URL, tools } from "../src/app/tools";
import { expect, isMobile, openNav, test } from "./fixtures";

const pages = [{ href: "/", name: "デベロッパーツール" }, ...tools];

test.describe("サイト全体", () => {
  test("ホームに全ツールのカードがあり、開くとツールのページに移る", async ({ page }) => {
    await page.goto("/");
    for (const tool of tools) {
      await expect(page.getByRole("link", { name: new RegExp(tool.name) }).last()).toHaveAttribute(
        "href",
        tool.href
      );
    }

    const tool = tools[1];
    await page.getByRole("main").getByRole("link", { name: new RegExp(tool.name) }).click();
    await expect(page).toHaveURL(tool.href);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(tool.name);
  });

  test("ナビから各ツールに移動でき、現在のページが示される", async ({ page }) => {
    await page.goto("/");
    for (const tool of tools) {
      const nav = await openNav(page);
      await nav.getByRole("link", { name: tool.name }).click();
      await expect(page).toHaveURL(tool.href);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(tool.name);
      await expect(page).toHaveTitle(`${tool.name} | デベロッパーツール`);

      if (isMobile(page)) {
        // 移動したらメニューは閉じる
        await expect(page.getByRole("navigation", { name: "ツール" }).filter({ visible: true })).toHaveCount(0);
      }
      const current = (await openNav(page)).getByRole("link", { name: tool.name });
      await expect(current).toHaveAttribute("aria-current", "page");
      if (isMobile(page)) await page.keyboard.press("Escape");
    }
  });

  test("ナビにGitHubリポジトリへのリンクがある", async ({ page }) => {
    await page.goto("/");
    await openNav(page);
    // フッターはナビ(<nav>)の外にあるので、表示中のドロワーから探す
    const link = page.getByRole("link", { name: "GitHub（ソースコード）" }).filter({ visible: true });
    await expect(link).toHaveAttribute("href", GITHUB_URL);
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("最初の Tab でスキップリンクにフォーカスし、Enter で本文に移る", async ({ page }) => {
    await page.goto(tools[0].href);
    const skip = page.getByRole("link", { name: "本文へスキップ" });
    await page.keyboard.press("Tab");
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    // 次の Tab はナビを飛ばして本文の中に進む
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest("main"))).toBe(true);
  });

  test("404ページを表示し、一覧に戻れる", async ({ page }) => {
    // ホスティングは存在しないURLに 404.html を返す(vite preview はそうしないので直接開く)
    await page.goto("/404.html");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ページが見つかりません");
    await page.getByRole("link", { name: "ツール一覧に戻る" }).click();
    await expect(page).toHaveURL("/");
  });

  for (const { href, name } of pages) {
    test(`${name}: 見出しが1つで、横スクロールが出ない`, async ({ page }) => {
      await page.goto(href);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      // サイドバーやヘッダーの見出しがページの h1 より前に来ない
      await expect(page.getByRole("heading").first()).toHaveText(name);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe("配色", () => {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`${colorScheme}: 背景・本文・補足の文字色がテーマどおりになる`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto("/jwt-decoder");

      const color = (selector: string, property: "color" | "backgroundColor" = "color") =>
        page.locator(selector).first().evaluate((el, prop) => getComputedStyle(el)[prop], property);

      const background = await color("body", "backgroundColor");
      const heading = await color("h1");
      const description = await color("h1 + p");

      const luminance = (rgb: string) => {
        const [r, g, b] = rgb.match(/\d+/g)!.map(Number);
        return (r * 299 + g * 587 + b * 114) / 1000;
      };
      if (colorScheme === "dark") {
        expect(luminance(background)).toBeLessThan(50);
        expect(luminance(heading)).toBeGreaterThan(200);
      } else {
        expect(luminance(background)).toBeGreaterThan(200);
        expect(luminance(heading)).toBeLessThan(50);
      }
      // 説明文は見出しより控えめな色(text.secondary)になる。MUI の system props 廃止で一度崩れた箇所
      expect(description).not.toBe(heading);
    });
  }
});

test.describe("入力が送信されない", () => {
  test("ツールを使っても外部への通信が起きない", async ({ page, externalRequests }) => {
    await page.goto("/jwt-decoder");
    await page.waitForLoadState("networkidle");
    // ページ読み込み時の計測タグ(本番ビルドの GA)は除き、操作中の通信だけを見る
    externalRequests.length = 0;

    await page
      .getByLabel("デコードするJWT")
      .fill(
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
      );
    await page.getByRole("button", { name: "デコード" }).click();
    await page.goto("/base64");
    await page.getByLabel("エンコードするテキスト").fill("secret");
    await page.waitForLoadState("networkidle");

    expect(externalRequests.filter((url) => url.includes("secret") || url.includes("eyJ"))).toEqual(
      []
    );
  });

  test("Google Analytics の読み込みと送信は CSP で止まらない", async ({ page }) => {
    // 本物の gtag.js の代わりに、GA4 と同じ送信先へ通信するスクリプトを返す。
    // 送信自体は fixtures が中断するので計測は届かず、CSP 違反だけが fixtures のチェックで検出される
    const collect = [
      "https://www.google-analytics.com/g/collect",
      "https://region1.google-analytics.com/g/collect",
      "https://region1.analytics.google.com/g/collect",
    ];
    await page.route("https://www.googletagmanager.com/gtag/js*", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: `window.__gaStub = Promise.allSettled(${JSON.stringify(collect)}.flatMap((url) => [
          fetch(url, { method: "POST" }),
          new Promise((resolve) => { const img = new Image(); img.onload = img.onerror = resolve; img.src = url; }),
        ]));`,
      })
    );
    await page.goto("/jwt-decoder");
    await page.waitForFunction(() => "__gaStub" in window);
    await page.evaluate(() => (window as unknown as { __gaStub: Promise<unknown> }).__gaStub);
  });

  test("CSP で自サイトと Google Analytics 以外への通信が禁止されている", async ({
    page,
    externalRequests,
    pageErrors,
  }) => {
    await page.goto("/jwt-decoder");
    // 意図的に違反させ、ページ内で違反イベントを受け取る
    const blocked = await page.evaluate(async () => {
      const violation = new Promise<string>((resolve) =>
        document.addEventListener("securitypolicyviolation", (e) =>
          resolve(`${e.effectiveDirective} ${e.blockedURI}`)
        )
      );
      await fetch("https://example.com/collect").catch(() => {});
      return violation;
    });
    expect(blocked).toBe("connect-src https://example.com/collect");
    // CSP で止まり、ブラウザから送信されていない
    expect(externalRequests).not.toContain("https://example.com/collect");
    // 意図した違反なので、fixtures の CSP 違反チェックからは外す
    expect(pageErrors.length).toBeGreaterThan(0);
    for (const error of pageErrors) expect(error).toContain("example.com/collect");
    pageErrors.length = 0;
  });
});
