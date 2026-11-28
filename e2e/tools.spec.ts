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

  test("ファイルを Base64 と data URL にする", async ({ page, externalRequests }) => {
    await page.goto("/base64");
    await page.waitForLoadState("networkidle");
    // ページ読み込み時の計測タグ(本番ビルドの GA)は除き、操作中の通信だけを見る
    externalRequests.length = 0;
    await page.getByLabel("Base64にするファイル").setInputFiles({
      name: "pixel.png",
      mimeType: "image/png",
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xff]),
    });
    await expect(page.getByText("pixel.png(9 バイト、image/png)")).toBeVisible();
    await expect(resultBlock(page, "ファイルのBase64").locator("pre")).toHaveText("iVBORw0KGgr/");
    await expect(resultBlock(page, "data URL").locator("pre")).toHaveText(
      "data:image/png;base64,iVBORw0KGgr/"
    );
    await page.getByLabel("URLセーフ(Base64URL)").check();
    await expect(resultBlock(page, "ファイルのBase64").locator("pre")).toHaveText("iVBORw0KGgr_");
    await page.waitForLoadState("networkidle");
    expect(externalRequests.filter((url) => url.includes("iVBORw0KGgr"))).toEqual([]);
  });

  test("バイナリのデコード結果を16進ダンプで表示し、ファイルとして保存できる", async ({ page }) => {
    await page.goto("/base64");
    await page.getByRole("button", { name: "デコード", exact: true }).click();
    await page.getByLabel("デコードするテキスト").fill("data:application/octet-stream;base64,AP/+");
    await expect(errorAlert(page)).toHaveCount(0);
    await expect(page.getByText("3 バイト(application/octet-stream)")).toBeVisible();
    await expect(resultBlock(page, "16進ダンプ").locator("pre")).toHaveText("00000000  00 ff fe");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /ファイルとして保存/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("decoded.bin");
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

test.describe("パスワード生成", () => {
  const generated = async (page: import("@playwright/test").Page) =>
    (await resultBlock(page, /生成結果/).locator("pre").textContent())!.split("\n");

  test("指定した長さ・個数で、選んだ種類の文字を必ず含めて生成する", async ({ page }) => {
    await page.goto("/password");
    await page.getByLabel("長さ").fill("12");
    await page.getByLabel("個数").fill("3");
    await page.getByRole("button", { name: "生成", exact: true }).click();

    const passwords = await generated(page);
    expect(passwords).toHaveLength(3);
    for (const password of passwords) {
      expect(password).toHaveLength(12);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[0-9]/);
      expect(password).toMatch(/[^A-Za-z0-9]/);
    }
    expect(new Set(passwords).size).toBe(3);
  });

  test("数字だけ・紛らわしい文字を除いて生成し、エントロピーを表示する", async ({ page }) => {
    await page.goto("/password");
    await page.getByLabel("英大文字(A-Z)").uncheck();
    await page.getByLabel("英小文字(a-z)").uncheck();
    await page.getByLabel("記号(!#$%など)").uncheck();
    await page.getByLabel("紛らわしい文字(0 O o 1 l I |)を除く").check();
    await page.getByLabel("長さ").fill("20");
    // 8種類の数字で20文字: 20 × log2(8) = 60ビット
    await expect(page.getByText("エントロピー: 約60ビット")).toBeVisible();
    await page.getByRole("button", { name: "生成", exact: true }).click();

    for (const password of await generated(page)) expect(password).toMatch(/^[2-9]{20}$/);
  });

  test("種類をすべて外すと生成できず、条件を変えると前の結果は消える", async ({ page }) => {
    await page.goto("/password");
    await page.getByRole("button", { name: "生成", exact: true }).click();
    await expect(resultBlock(page, /生成結果/)).toBeVisible();
    await page.getByLabel("数字(0-9)").uncheck();
    await expect(resultBlock(page, /生成結果/)).toHaveCount(0);

    await page.getByLabel("英大文字(A-Z)").uncheck();
    await page.getByLabel("英小文字(a-z)").uncheck();
    await page.getByLabel("記号(!#$%など)").uncheck();
    await expect(errorAlert(page)).toHaveText("文字の種類を1つ以上選んでください");
    await expect(page.getByRole("button", { name: "生成", exact: true })).toBeDisabled();
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

  test("ファイルのハッシュを計算し、貼り付けた値と照合する", async ({ page, externalRequests }) => {
    await page.goto("/hash");
    await page.waitForLoadState("networkidle");
    // ページ読み込み時の計測タグ(本番ビルドの GA)は除き、操作中の通信だけを見る
    externalRequests.length = 0;
    await page.getByRole("button", { name: "ファイル", exact: true }).click();
    await page.getByLabel("ハッシュを計算するファイル").setInputFiles({
      name: "abc.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("abc"),
    });
    await expect(page.getByText("abc.txt(3 バイト)")).toBeVisible();
    await expect(resultBlock(page, "SHA-256").locator("pre")).toHaveText(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
    await expect(resultBlock(page, "SHA-1").locator("pre")).toHaveText(
      "a9993e364706816aba3e25717850c26c9cd0d89d"
    );

    const expected = page.getByLabel("照合する値");
    await expected.fill("BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD");
    await expect(page.getByText("SHA-256 の値と一致しました。")).toBeVisible();
    await expected.fill("deadbeef");
    await expect(page.getByText("どのアルゴリズムの値とも一致しません。")).toBeVisible();

    // テキストに戻すとファイルの結果は出さない
    await page.getByRole("button", { name: "テキスト", exact: true }).click();
    await expect(resultBlock(page, "SHA-256")).toHaveCount(0);
    await page.waitForLoadState("networkidle");
    expect(externalRequests).toEqual([]);
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

test.describe("正規表現テスター", () => {
  test("一致した箇所とキャプチャグループを表示し、置換結果をコピーできる", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/regex");
    await page.getByLabel("正規表現のパターン").fill("(?<year>\\d{4})-(\\d{2})");
    await page.getByLabel("テスト文字列").fill("from 2026-11 to 2027-01");

    const highlighted = page.getByRole("region", { name: "一致した箇所" });
    await expect(highlighted.getByRole("status")).toHaveText("2 件一致");
    await expect(highlighted.locator("mark")).toHaveText(["2026-11", "2027-01"]);
    const list = page.getByRole("region", { name: "一致の一覧" });
    await expect(list.getByRole("listitem").first()).toContainText("位置 5〜12");
    await expect(list.getByRole("listitem").first()).toContainText('グループ <year>"2026"');

    // g を外すと最初の1件だけになる
    await page.getByRole("button", { name: "全体(g)" }).click();
    await expect(highlighted.getByRole("status")).toHaveText("1 件一致");
    await page.getByRole("button", { name: "全体(g)" }).click();

    await page.getByLabel("置換する").check();
    await page.getByLabel("置換文字列").fill("$2/$<year>");
    const replaced = resultBlock(page, "置換結果");
    await expect(replaced.locator("pre")).toHaveText("from 11/2026 to 01/2027");
    await replaced.getByRole("button", { name: "置換結果をコピー" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "from 11/2026 to 01/2027"
    );
  });

  test("構文エラーを表示し、パターンを直すと消える", async ({ page }) => {
    await page.goto("/regex");
    await page.getByLabel("テスト文字列").fill("abc");
    const pattern = page.getByLabel("正規表現のパターン");
    await pattern.fill("(a");
    await expect(errorAlert(page)).toContainText("正規表現が正しくありません");
    await pattern.fill("(a)");
    await expect(errorAlert(page)).toHaveCount(0);
    await expect(page.getByRole("region", { name: "一致した箇所" }).locator("mark")).toHaveText(
      "a"
    );
  });

  test("u と v のフラグは片方を選ぶともう片方が外れる", async ({ page }) => {
    await page.goto("/regex");
    await page.getByLabel("正規表現のパターン").fill("a");
    await page.getByLabel("テスト文字列").fill("a");
    const u = page.getByRole("button", { name: "Unicode(u)" });
    const v = page.getByRole("button", { name: "Unicode 集合(v)" });
    await u.click();
    await expect(u).toHaveAttribute("aria-pressed", "true");
    await v.click();
    await expect(v).toHaveAttribute("aria-pressed", "true");
    await expect(u).toHaveAttribute("aria-pressed", "false");
    await expect(errorAlert(page)).toHaveCount(0);
    await expect(page.getByRole("region", { name: "一致した箇所" }).getByRole("status")).toHaveText(
      "1 件一致"
    );
    await u.click();
    await expect(v).toHaveAttribute("aria-pressed", "false");
  });

  test("終わらない照合は中断し、次の入力では照合できる", async ({ page }) => {
    await page.goto("/regex");
    await page.getByLabel("テスト文字列").fill(`${"a".repeat(40)}!`);
    const pattern = page.getByLabel("正規表現のパターン");
    await pattern.fill("(a+)+$");
    await expect(errorAlert(page)).toContainText("中断しました", { timeout: 10_000 });
    await pattern.fill("a+");
    await expect(page.getByRole("region", { name: "一致した箇所" }).getByRole("status")).toHaveText(
      "1 件一致"
    );
  });
});

test.describe("進数変換", () => {
  test("10進数を各進数に変換し、16進数の入力と不正な文字のエラー", async ({ page }) => {
    await page.goto("/base-convert");
    const input = page.getByLabel("変換する数値");
    await input.fill("18446744073709551617");
    await expect(definition(page, "2進数")).toHaveText(`1${"0".repeat(63)}1`);
    await expect(definition(page, "8進数")).toHaveText("2000000000000000000001");
    await expect(definition(page, "16進数")).toHaveText("10000000000000001");
    await expect(page.getByRole("button", { name: "16進数をコピー" })).toBeVisible();

    await page.getByRole("button", { name: "16進数", exact: true }).click();
    await input.fill("-0xFF_FF");
    await expect(definition(page, "10進数")).toHaveText("-65535");
    await page.getByLabel("2進数を4桁ごとに区切る").check();
    await expect(definition(page, "2進数")).toHaveText("-1111 1111 1111 1111");

    await input.fill("0xfg");
    await expect(errorAlert(page)).toContainText("4文字目の「g」");
    await expect(page.getByRole("button", { name: "10進数をコピー" })).toHaveCount(0);
  });
});
