import { definition, errorAlert, expect, resultBlock, test } from "./fixtures";

test.describe("文字数カウンター", () => {
  test("絵文字の結合も1文字として数える", async ({ page }) => {
    await page.goto("/char-count");
    await page.getByLabel("文字数を数えるテキスト").fill("こんにちは👨‍👩‍👧");
    await expect(page.getByText("文字数", { exact: true }).locator("..")).toHaveText("文字数6");
  });
});

test.describe("JSON整形", () => {
  test("整形した結果を表示してコピーできる", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/json-formatter");
    await page.getByLabel("整形するJSON").fill('{"a":1,"b":[true,null]}');
    await page.getByRole("button", { name: "整形" }).click();

    const expected = '{\n  "a": 1,\n  "b": [\n    true,\n    null\n  ]\n}';
    const result = resultBlock(page, "整形結果");
    await expect(result.locator("pre")).toHaveText(expected);

    await result.getByRole("button", { name: "整形結果をコピー" }).click();
    await expect(result.getByRole("button", { name: "コピーしました" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
  });

  test("不正なJSONはエラーを表示し、入力を変えると消える", async ({ page }) => {
    await page.goto("/json-formatter");
    const input = page.getByLabel("整形するJSON");
    await input.fill('{"a":1');
    await page.getByRole("button", { name: "整形" }).click();
    await expect(errorAlert(page)).toBeVisible();

    await input.fill('{"a":1}');
    await expect(errorAlert(page)).toHaveCount(0);
  });
});

test.describe("JWTデコーダー", () => {
  test("ヘッダー・ペイロードと有効期限を表示する", async ({ page }) => {
    await page.goto("/jwt-decoder");
    // {"alg":"HS256","typ":"JWT"}.{"sub":"1234567890","iat":1516239022,"exp":1516239022}
    await page
      .getByLabel("デコードするJWT")
      .fill(
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.sig"
      );
    await page.getByRole("button", { name: "デコード" }).click();

    await expect(resultBlock(page, "ヘッダー").locator("pre")).toContainText('"alg": "HS256"');
    await expect(resultBlock(page, "ペイロード").locator("pre")).toContainText(
      '"sub": "1234567890"'
    );
    await expect(resultBlock(page, "ペイロード")).toContainText("有効期限(exp): 2018/1/18 10:30:22(期限切れ)");
    await expect(resultBlock(page, "署名").locator("pre")).toHaveText("sig");
  });

  test("JWTでない入力はエラーにする", async ({ page }) => {
    await page.goto("/jwt-decoder");
    await page.getByLabel("デコードするJWT").fill("not-a-jwt");
    await page.getByRole("button", { name: "デコード" }).click();
    await expect(errorAlert(page)).toBeVisible();
    await expect(resultBlock(page, "ヘッダー")).toHaveCount(0);
  });
});

test.describe("Unixタイムスタンプ変換", () => {
  test("タイムスタンプを日時に変換する", async ({ page }) => {
    await page.goto("/unix-timestamp");
    await page.getByLabel("変換するUnixタイムスタンプ").fill("1700000000");
    await expect(definition(page, "ローカル(Asia/Tokyo)")).toHaveText("2023-11-15 07:13:20");
    await expect(definition(page, "UTC")).toHaveText("2023-11-14 22:13:20");
    await expect(page.getByText("秒として解釈しました")).toBeVisible();

    await page.getByRole("button", { name: "ミリ秒", exact: true }).click();
    await expect(definition(page, "UTC")).toHaveText("1970-01-20 16:13:20");
  });

  test("日時をタイムスタンプに変換する(タイムゾーンを切り替えられる)", async ({ page }) => {
    await page.goto("/unix-timestamp");
    await page.getByLabel("変換する日時").fill("2023-11-15 07:13:20");
    await expect(definition(page, "秒")).toHaveText("1700000000");

    await page.getByRole("button", { name: "UTC", exact: true }).click();
    await expect(definition(page, "秒")).toHaveText("1700032400");
  });

  test("数値でない入力はエラーにする", async ({ page }) => {
    await page.goto("/unix-timestamp");
    await page.getByLabel("変換するUnixタイムスタンプ").fill("abc");
    await expect(errorAlert(page)).toBeVisible();
  });
});

test.describe("Base64エンコード・デコード", () => {
  test("エンコードし、結果を入力に移してデコードで戻せる", async ({ page }) => {
    await page.goto("/base64");
    await page.getByLabel("エンコードするテキスト").fill("こんにちは 👍");
    await expect(resultBlock(page, "エンコード結果").locator("pre")).toHaveText(
      "44GT44KT44Gr44Gh44GvIPCfkY0="
    );

    await page.getByLabel("URLセーフ(Base64URL)").check();
    await expect(resultBlock(page, "エンコード結果").locator("pre")).toHaveText(
      "44GT44KT44Gr44Gh44GvIPCfkY0"
    );

    await page.getByRole("button", { name: "結果を入力にしてデコード" }).click();
    await expect(page.getByLabel("デコードするテキスト")).toHaveValue("44GT44KT44Gr44Gh44GvIPCfkY0");
    await expect(resultBlock(page, "デコード結果").locator("pre")).toHaveText("こんにちは 👍");
  });

  test("Base64でない入力はエラーにする", async ({ page }) => {
    await page.goto("/base64");
    await page.getByRole("button", { name: "デコード", exact: true }).click();
    await page.getByLabel("デコードするテキスト").fill("abc*");
    await expect(errorAlert(page)).toContainText("「*」");
  });
});

test.describe("URLエンコード・デコード", () => {
  test("エンコードとフォーム形式の切り替え", async ({ page }) => {
    await page.goto("/url-encode");
    await page.getByLabel("エンコードするテキスト").fill("東京 a&b");
    const result = resultBlock(page, "エンコード結果").locator("pre");
    await expect(result).toHaveText("%E6%9D%B1%E4%BA%AC%20a%26b");

    await page.getByLabel(/フォーム形式/).check();
    await expect(result).toHaveText("%E6%9D%B1%E4%BA%AC+a%26b");
  });

  test("デコードと不正な%のエラー", async ({ page }) => {
    await page.goto("/url-encode");
    await page.getByRole("button", { name: "デコード", exact: true }).click();
    const input = page.getByLabel("デコードするテキスト");
    await input.fill("%E6%9D%B1%E4%BA%AC");
    await expect(resultBlock(page, "デコード結果").locator("pre")).toHaveText("東京");

    await input.fill("100%");
    await expect(errorAlert(page)).toContainText("4文字目");
  });
});

test.describe("UUID生成", () => {
  const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  const V7_COMPACT_UPPER = /^[0-9A-F]{12}7[0-9A-F]{3}[89AB][0-9A-F]{15}$/;

  const generated = async (page: import("@playwright/test").Page) =>
    (await resultBlock(page, /生成結果/).locator("pre").textContent())!.split("\n");

  test("指定した個数の v4 を生成する", async ({ page }) => {
    await page.goto("/uuid");
    await page.getByLabel("個数").fill("3");
    await page.getByRole("button", { name: "生成", exact: true }).click();

    const uuids = await generated(page);
    expect(uuids).toHaveLength(3);
    for (const uuid of uuids) expect(uuid).toMatch(V4);
    expect(new Set(uuids).size).toBe(3);
  });

  test("v7 を書式を変えて表示し、個数は上限で止める", async ({ page }) => {
    await page.goto("/uuid");
    await page.getByRole("button", { name: "v7" }).click();
    await page.getByLabel("個数").fill("1000");
    await page.getByRole("button", { name: "生成", exact: true }).click();
    await expect(page.getByLabel("個数")).toHaveValue("100");

    await page.getByLabel("大文字").check();
    await page.getByLabel("ハイフンを入れる").uncheck();
    const uuids = await generated(page);
    expect(uuids).toHaveLength(100);
    for (const uuid of uuids) expect(uuid).toMatch(V7_COMPACT_UPPER);
    expect(uuids).toEqual([...uuids].sort());
  });

  test("バージョンを変えると前の結果は消える", async ({ page }) => {
    await page.goto("/uuid");
    await page.getByRole("button", { name: "生成", exact: true }).click();
    await expect(resultBlock(page, /生成結果/)).toBeVisible();
    await page.getByRole("button", { name: "v7" }).click();
    await expect(resultBlock(page, /生成結果/)).toHaveCount(0);
  });
});
