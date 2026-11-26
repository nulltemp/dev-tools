import { definition, errorAlert, expect, resultBlock, test } from "./fixtures";

test.describe("文字数カウンター", () => {
  test("絵文字の結合も1文字として数える", async ({ page }) => {
    await page.goto("/char-count");
    await page.getByLabel("文字数を数えるテキスト").fill("こんにちは👨‍👩‍👧");
    await expect(page.getByText("文字数", { exact: true }).locator("..")).toHaveText("文字数6");
  });

  test("空白・改行を除いた文字数、行数、バイト数を表示する", async ({ page }) => {
    await page.goto("/char-count");
    await page.getByLabel("文字数を数えるテキスト").fill("あい う\nab");
    const stat = (label: string) => page.getByText(label, { exact: true }).locator("..");
    await expect(stat("文字数")).toHaveText("文字数7");
    await expect(stat("空白・改行を除いた文字数")).toHaveText("空白・改行を除いた文字数5");
    await expect(stat("行数")).toHaveText("行数2");
    await expect(stat("バイト数（UTF-8）")).toHaveText("バイト数（UTF-8）13");
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

  test("インデント幅を選び、Ctrl+Enter で整形できる", async ({ page }) => {
    await page.goto("/json-formatter");
    await page.getByRole("button", { name: "4スペース" }).click();
    const input = page.getByLabel("整形するJSON");
    await input.fill('{"a":[1]}');
    await input.press("Control+Enter");
    const result = resultBlock(page, "整形結果");
    await expect(result.locator("pre")).toHaveText('{\n    "a": [\n        1\n    ]\n}');

    await page.getByRole("button", { name: "2スペース" }).click();
    await expect(result.locator("pre")).toHaveText('{\n  "a": [\n    1\n  ]\n}');
  });

  test("圧縮した結果を表示する", async ({ page }) => {
    await page.goto("/json-formatter");
    await page.getByLabel("整形するJSON").fill('{\n  "a": 1,\n  "b": [ true ]\n}');
    await page.getByRole("button", { name: "圧縮" }).click();
    await expect(resultBlock(page, "圧縮結果").locator("pre")).toHaveText('{"a":1,"b":[true]}');
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

  test("マイクロ秒の値を桁数から自動判定する", async ({ page }) => {
    await page.goto("/unix-timestamp");
    await page.getByLabel("変換するUnixタイムスタンプ").fill("1700000000000000");
    await expect(definition(page, "UTC")).toHaveText("2023-11-14 22:13:20");
    await expect(page.getByText("マイクロ秒として解釈しました")).toBeVisible();
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

test.describe("ハッシュ生成", () => {
  test("SHA-256 などを計算し、出力形式を切り替えられる", async ({ page }) => {
    await page.goto("/hash");
    await page.getByLabel("ハッシュを計算するテキスト").fill("abc");
    const sha256 = resultBlock(page, "SHA-256").locator("pre");
    await expect(sha256).toHaveText(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
    await expect(resultBlock(page, "SHA-1").locator("pre")).toHaveText(
      "a9993e364706816aba3e25717850c26c9cd0d89d"
    );

    await page.getByRole("button", { name: "16進(大文字)" }).click();
    await expect(sha256).toHaveText(
      "BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD"
    );
    await page.getByRole("button", { name: "Base64" }).click();
    await expect(sha256).toHaveText("ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=");
  });

  test("HMAC を計算し、入力を消すと結果も消える", async ({ page }) => {
    await page.goto("/hash");
    const input = page.getByLabel("ハッシュを計算するテキスト");
    await input.fill("what do ya want for nothing?");
    await page.getByLabel("HMAC", { exact: true }).check();
    await page.getByLabel("HMACの秘密鍵").fill("Jefe");
    await expect(resultBlock(page, "HMAC-SHA-256").locator("pre")).toHaveText(
      "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843"
    );

    await input.fill("");
    await expect(resultBlock(page, "HMAC-SHA-256")).toHaveCount(0);
  });

  test("HMAC の秘密鍵が空なら、エラーではなく鍵の入力を案内する", async ({ page }) => {
    await page.goto("/hash");
    await page.getByLabel("ハッシュを計算するテキスト").fill("abc");
    await page.getByLabel("HMAC", { exact: true }).check();
    await expect(page.getByLabel("HMACの秘密鍵")).toBeFocused();
    await expect(page.getByText("秘密鍵を入力してください")).toBeVisible();
    await expect(errorAlert(page)).toHaveCount(0);
    await expect(resultBlock(page, "HMAC-SHA-256")).toHaveCount(0);
  });
});

test.describe("テキスト差分", () => {
  test("追加・削除された行と変更された文字を表示し、unified diff でコピーできる", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/diff");
    await page.getByLabel("変更前のテキスト").fill("host: a\nport: 8080\nold");
    await page.getByLabel("変更後のテキスト").fill("host: a\nport: 8081");

    const result = resultBlock(page, "差分");
    await expect(result.getByText("追加 1 行・削除 2 行")).toBeVisible();
    const rows = result.locator("tbody tr");
    await expect(rows).toHaveText(["11host: a", "2-port: 8080", "3-old", "2+port: 8081"]);
    await expect(rows.nth(1).locator("mark")).toHaveText("0");
    await expect(rows.nth(3).locator("mark")).toHaveText("1");

    await result.getByRole("button", { name: "unified diff 形式でコピー" }).click();
    await expect(result.getByRole("button", { name: "コピーしました" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "--- 変更前\n+++ 変更後\n@@ -1,3 +1,2 @@\n host: a\n-port: 8080\n-old\n+port: 8081\n"
    );
  });

  test("変更から離れた変更のない行を畳み、展開・すべて表示できる", async ({ page }) => {
    await page.goto("/diff");
    const before = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`);
    const after = before.map((line, i) => (i === 9 ? "changed" : line));
    await page.getByLabel("変更前のテキスト").fill(before.join("\n"));
    await page.getByLabel("変更後のテキスト").fill(after.join("\n"));

    const result = resultBlock(page, "差分");
    const rows = result.locator("tbody tr");
    // 10行目の変更(2行)と前後3行ずつ、その前後の6行・7行は畳む
    await expect(rows).toHaveCount(10);
    await expect(rows.first()).toHaveText("… 6 行の変更なし(表示する)");
    await expect(rows.last()).toHaveText("… 7 行の変更なし(表示する)");

    await result.getByRole("button", { name: "… 6 行の変更なし(表示する)" }).click();
    await expect(rows).toHaveCount(15);
    await expect(rows.first()).toHaveText("11line 1");

    await result.getByLabel("変更のない行もすべて表示").check();
    await expect(rows).toHaveCount(21);
    await expect(result.locator('tbody tr[data-type="skip"]')).toHaveCount(0);
  });

  test("空白・大文字小文字の違いを無視でき、差分がなければそう表示する", async ({ page }) => {
    await page.goto("/diff");
    await page.getByLabel("変更前のテキスト").fill("Hello  World");
    await page.getByLabel("変更後のテキスト").fill("hello world");
    await expect(resultBlock(page, "差分").getByText("追加 1 行・削除 1 行")).toBeVisible();

    await page.getByLabel("空白の違いを無視").check();
    await page.getByLabel("大文字・小文字を無視").check();
    await expect(page.getByText("差分はありません。")).toBeVisible();
    await expect(resultBlock(page, "差分")).toHaveCount(0);

    await page.getByLabel("変更前のテキスト").fill("");
    await page.getByLabel("変更後のテキスト").fill("");
    await expect(page.getByText("差分はありません。")).toHaveCount(0);
  });
});
