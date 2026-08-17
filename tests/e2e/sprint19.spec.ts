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

async function openColorTool(page: Page) {
  await page.goto("/zh/tools/color-converter");
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
}

async function expectColorWorker(page: Page) {
  await expect
    .poll(() =>
      page.evaluate((name) => {
        return (window as WorkerProbeWindow).__toolWorkerNames.includes(
          `devtoolbox-${name}`,
        );
      }, "color-analyze"),
    )
    .toBe(true);
}

function colorRow(page: Page, label: string) {
  return page.locator(".color-value-row").filter({
    has: page.getByText(label, { exact: true }),
  });
}

test("颜色工具支持 HSL、HSV、CMYK 转换和 WCAG 结果", async ({ page }) => {
  await installWorkerProbe(page);
  await openColorTool(page);

  const input = page.getByLabel("颜色值（HEX、RGB、HSL、HSV 或 CMYK）");
  await input.fill("hsl(0, 100%, 50%)");
  await expect(page.locator(".color-source-preview strong")).toHaveText(
    "#FF0000",
  );
  await expect(colorRow(page, "RGB")).toContainText("rgb(255, 0, 0)");
  await expect(colorRow(page, "HSL")).toContainText("hsl(0, 100%, 50%)");
  await expect(colorRow(page, "HSV")).toContainText("hsv(0, 100%, 100%)");
  await expect(colorRow(page, "CMYK")).toContainText(
    "cmyk(0%, 100%, 100%, 0%)",
  );
  await expect(page.getByText("可读性对比度", { exact: true })).toBeVisible();
  await expect(page.getByText("互补色", { exact: true })).toBeVisible();
  await expectColorWorker(page);

  await input.fill("cmyk(100%, 0%, 0%, 0%)");
  await expect(page.locator(".color-source-preview strong")).toHaveText(
    "#00FFFF",
  );
});

test("颜色工具生成调色板和 CSS 变量", async ({ page }) => {
  await openColorTool(page);

  await page.getByRole("tab", { name: "调色板", exact: true }).click();
  await expect(page.locator(".color-palette-swatch")).toHaveCount(10);
  await expect(page.getByText("50", { exact: true })).toBeVisible();
  await expect(page.getByText("900", { exact: true })).toBeVisible();

  await page.getByRole("tab", { name: "CSS 生成器", exact: true }).click();
  const cssOutput = page.locator(".color-css-output");
  await expect(cssOutput).toContainText("--color-primary: #2563EB;");
  await expect(cssOutput).toContainText("--color-primary-complement:");
  const cssActions = page.locator(".color-css-view .button");
  await expect(cssActions).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "复制", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "下载", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "下载 JSON", exact: true }),
  ).toBeVisible();
});

test("颜色工具支持随机颜色并本地化非法输入", async ({ page }) => {
  await openColorTool(page);
  const input = page.getByLabel("颜色值（HEX、RGB、HSL、HSV 或 CMYK）");
  const original = await input.inputValue();

  await page.getByRole("button", { name: "随机颜色", exact: true }).click();
  await expect(input).not.toHaveValue(original);
  await expect(page.locator(".color-source-preview strong")).toHaveText(
    /^#[0-9A-F]{6}$/,
  );

  await input.fill("hsl(361, 50%, 50%)");
  await expect(page.locator(".error-banner[role='alert']")).toContainText(
    "颜色色相必须在 0 到 360 度之间",
  );
  await input.fill("hsv(10, 101%, 50%)");
  await expect(page.locator(".error-banner[role='alert']")).toContainText(
    "颜色百分比必须在 0% 到 100% 之间",
  );
});

test("Sprint 19 颜色工具支持深色模式", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("devtoolbox:theme", "dark"),
  );
  await openColorTool(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".color-converter-workspace")).toBeVisible();
  await expect(page.locator(".color-view-tabs")).toBeVisible();
  await expect(page.locator(".color-source-preview")).toBeVisible();
});

test("Sprint 19 颜色工具在移动端无页面级横向溢出", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "移动端专属检查");
  await openColorTool(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});
