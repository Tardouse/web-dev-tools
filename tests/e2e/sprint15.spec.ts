import { expect, test, type Page } from "@playwright/test";

type WorkerProbeWindow = typeof window & { __toolWorkerNames: string[] };

async function installWorkerProbe(page: Page) {
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    const names: string[] = [];
    Object.defineProperty(window, "__toolWorkerNames", {
      value: names,
      configurable: true,
    });
    window.Worker = class ToolWorkerProbe extends NativeWorker {
      constructor(scriptURL: string | URL, options?: WorkerOptions) {
        names.push(options?.name ?? String(scriptURL));
        super(scriptURL, options);
      }
    };
  });
}

async function openTool(page: Page, slug: string) {
  await page.goto(`/zh/tools/${slug}`);
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
}

async function expectWorker(page: Page, operation: string) {
  await expect
    .poll(() =>
      page.evaluate(
        (name) =>
          (window as WorkerProbeWindow).__toolWorkerNames.includes(
            `devtoolbox-${name}`,
          ),
        operation,
      ),
    )
    .toBe(true);
}

test("Base64 支持自动识别、文件往返与图片 Data URL", async ({ page }) => {
  await installWorkerProbe(page);

  await openTool(page, "base64");
  await page.getByRole("button", { name: "自动", exact: true }).click();
  await page.getByLabel("输入").fill("5LiW55WM");
  await page.getByRole("button", { name: "自动识别" }).click();
  await expect(page.locator(".editor-output")).toHaveText("世界");
  await expectWorker(page, "base64-auto");

  await openTool(page, "file-base64");
  await page.getByLabel("选择要编码的文件").setInputFiles({
    name: "hello.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hello file", "utf8"),
  });
  await page.getByRole("button", { name: "编码文件" }).click();
  await expect(page.getByLabel("Base64 输出")).toHaveValue(
    "data:text/plain;base64,aGVsbG8gZmlsZQ==",
  );
  await expectWorker(page, "file-base64-encode");

  await page.getByRole("button", { name: "Base64 转文件" }).click();
  await page
    .getByLabel("Base64 文件数据")
    .fill("data:text/plain;base64,aGVsbG8gZmlsZQ==");
  await page.getByRole("button", { name: "解码文件" }).click();
  await expect(page.getByText("text/plain", { exact: true })).toBeVisible();
  await expect(page.getByText("10 B", { exact: true })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载文件" }).click();
  expect((await download).suggestedFilename()).toBe("decoded-file.txt");
  await expectWorker(page, "file-base64-decode");

  await openTool(page, "image-workbench");
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR4nGP4z8DAwMDAxAADCBYAOgYCAZ5uN6sAAAAASUVORK5CYII=";
  await page.getByLabel("选择要处理的图片").setInputFiles({
    name: "pixel.png",
    mimeType: "image/png",
    buffer: Buffer.from(pngBase64, "base64"),
  });
  await page.getByLabel("输出格式").selectOption("image/png");
  await page.getByRole("button", { name: "处理图片", exact: true }).click();
  await expect(page.getByLabel("Base64 Data URL")).toHaveValue(
    /^data:image\/png;base64,/,
  );
  await page.getByRole("button", { name: "Base64 → 图片" }).click();
  await page
    .getByLabel("Base64 图片数据")
    .fill(`data:image/png;base64,${pngBase64}`);
  await page.getByRole("button", { name: "解析图片" }).click();
  await expect(page.getByAltText("原图预览")).toBeVisible();
});

test("URL 与 Query String 工具保留规范化和重复参数", async ({ page }) => {
  await installWorkerProbe(page);

  await openTool(page, "url-parser");
  await page
    .getByLabel("完整 URL")
    .fill("https://example.com:8443/a%20b?q=one&q=two#part");
  await page.getByRole("button", { name: "解析 URL" }).click();
  await expect(page.locator(".editor-output")).toContainText(
    '"pathSegments": [',
  );
  await expect(page.locator(".editor-output")).toContainText('"q": [');
  await expect(page.locator(".editor-output")).toContainText(
    '"effectivePort": "8443"',
  );
  await expectWorker(page, "url-parse");

  await openTool(page, "query-string-parser");
  await page
    .getByLabel("URL 或查询字符串")
    .fill("?q=dev+tools&tag=url&tag=utf8");
  await page.getByRole("button", { name: "解析参数" }).click();
  await expect(page.locator(".editor-output")).toContainText(
    '"q": "dev tools"',
  );
  await expect(page.locator(".editor-output")).toContainText('"tag": [');
  await expectWorker(page, "query-parse");

  await openTool(page, "query-string-generator");
  await expect(page.locator(".query-output pre")).toHaveText(
    "?q=developer+tools&tag=url&tag=encoding",
  );
  await page.getByLabel("参数名 1").fill("search");
  await page.getByLabel("参数值 1").fill("a & b");
  await expect(page.locator(".query-output pre")).toContainText(
    "?search=a+%26+b&tag=url&tag=encoding",
  );
  await page.getByRole("button", { name: "删除参数 2" }).click();
  await expect(page.locator(".query-output pre")).toHaveText(
    "?search=a+%26+b&tag=encoding",
  );
});

test("Unicode 与 ASCII 工具覆盖转义、代码转换和字符表", async ({ page }) => {
  await installWorkerProbe(page);

  await openTool(page, "unicode-converter");
  await page.getByLabel("文本或 Unicode 转义").fill("世界🚀");
  await page.getByRole("button", { name: "编码", exact: true }).last().click();
  await expect(page.locator(".editor-output")).toHaveText(
    "\\u4E16\\u754C\\u{1F680}",
  );
  await expectWorker(page, "unicode-encode");
  await page.getByRole("button", { name: "解码", exact: true }).first().click();
  await page.getByLabel("文本或 Unicode 转义").fill("\\uD800");
  await page.getByRole("button", { name: "解码", exact: true }).last().click();
  await expect(page.locator(".error-banner")).toContainText("孤立代理项");

  await openTool(page, "ascii-converter");
  await page.getByLabel("ASCII 输出进制").selectOption("hex");
  await page.getByLabel("ASCII 文本或代码").fill("AZ!");
  await page.getByRole("button", { name: "编码", exact: true }).click();
  await expect(page.locator(".editor-output")).toHaveText("0x41 0x5A 0x21");
  await expectWorker(page, "ascii-encode");
  await page.getByRole("button", { name: "代码转文本" }).click();
  await page.getByLabel("ASCII 文本或代码").fill("65 0x5A 0b00100001");
  await page.getByRole("button", { name: "解码", exact: true }).click();
  await expect(page.locator(".editor-output")).toHaveText("AZ!");

  await openTool(page, "ascii-table");
  await page.getByLabel("搜索 ASCII 字符").fill("line feed");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.getByText("LF (Line Feed)", { exact: true })).toBeVisible();
  await expect(page.getByText("0x0A", { exact: true })).toBeVisible();
});

test("UTF-8 查看器在 Worker 中统计码点并限制明细渲染", async ({ page }) => {
  await installWorkerProbe(page);
  await openTool(page, "utf8-inspector");
  await page.getByLabel("UTF-8 文本输入").fill("A世🚀");
  await expect(page.getByText("8", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("U+4E16", { exact: true })).toBeVisible();
  await expect(page.getByText("E4 B8 96", { exact: true })).toBeVisible();
  await expect(page.getByText("U+1F680", { exact: true })).toBeVisible();
  await expectWorker(page, "utf8-inspect");

  await page.getByLabel("UTF-8 文本输入").fill("a".repeat(1_050));
  await expect(
    page.getByText(/仅展示前 1000 个码点，其余 50 个/),
  ).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(100);
  await page.getByRole("button", { name: "再显示 100 项" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(200);
});

test("Sprint 15 编码工具在移动端无页面级横向溢出", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "移动端专属检查");
  for (const slug of [
    "base64",
    "file-base64",
    "url-parser",
    "query-string-parser",
    "query-string-generator",
    "unicode-converter",
    "ascii-converter",
    "ascii-table",
    "utf8-inspector",
    "image-workbench",
  ]) {
    await openTool(page, slug);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      `${slug} should not overflow the mobile viewport`,
    ).toBe(true);
  }
});
