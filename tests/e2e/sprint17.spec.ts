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

test("Regex 支持捕获组、替换、模板、解释与 PCRE 说明", async ({ page }) => {
  await installWorkerProbe(page);
  await openTool(page, "regex-tester");

  await page.getByLabel("正则表达式").fill("(?<word>[A-Za-z]+)-(\\d+)");
  await page.getByLabel("测试文本").fill("item-42 and test-7");
  await page.getByLabel("替换表达式").fill("$1/$<word>/$2");

  const captureRows = page.locator(".regex-capture-table tbody tr");
  await expect(captureRows).toHaveCount(4);
  await expect(captureRows.nth(0)).toContainText("1 · word");
  await expect(captureRows.nth(0)).toContainText("item");
  await expect(captureRows.nth(1)).toContainText("42");
  await expect(page.getByLabel("替换结果")).toHaveText(
    "item/item/42 and test/test/7",
  );
  await expect(page.getByText("命名捕获分组", { exact: true })).toBeVisible();
  await expect(
    page.getByText("JavaScript 与 PCRE", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("PCRE 专属", { exact: true })).toBeVisible();
  await expectWorker(page, "regex-test");

  await page.getByLabel("常用正则模板").selectOption("iso-date");
  await expect(page.getByLabel("正则表达式")).toHaveValue(/\(\?<year>/);
  await expect(page.getByLabel("替换表达式")).toHaveValue(
    "$<day>/$<month>/$<year>",
  );
  await expect(page.getByLabel("替换结果")).toContainText("17/08/2026");

  await page.getByLabel("替换表达式").fill("x".repeat(10_001));
  await expect(page.locator(".error-banner[role='alert']")).toContainText(
    "正则替换表达式最多允许 10000 个字符",
  );
});

test("JSON Diff 规范化键顺序、显示值变化并本地化校验错误", async ({ page }) => {
  await installWorkerProbe(page);
  await openTool(page, "text-diff");
  await page.getByRole("button", { name: "JSON", exact: true }).click();

  await page.getByLabel("原始文本").fill('{"b":2,"a":1}');
  await page.getByLabel("修改后文本").fill('{"a":1,"b":2}');
  const result = page.getByTestId("inline-diff");
  await expect(result.locator(".diff-inline-unchanged")).toHaveCount(8);
  await expect(result.locator(".diff-inline-added")).toHaveCount(0);
  await expect(result.locator(".diff-inline-removed")).toHaveCount(0);
  await expect(result.locator(".diff-pane").first()).toContainText('"a": 1');
  await expect(result.locator(".diff-pane").first()).toContainText('"b": 2');
  await expectWorker(page, "diff");

  await page.getByLabel("修改后文本").fill('{"a":1,"b":3}');
  await expect(result.locator(".diff-inline-modified")).not.toHaveCount(0);

  await page.getByLabel("原始文本").fill("{");
  await expect(page.locator(".error-banner[role='alert']")).toContainText(
    "原始 JSON 无效",
  );
});

test("文本 Diff 可忽略大小写并保留两侧原文", async ({ page }) => {
  await openTool(page, "text-diff");
  await page.getByLabel("原始文本").fill("Hello\nKeep\n");
  await page.getByLabel("修改后文本").fill("hello\nkeep\n");
  await page.getByRole("checkbox", { name: "忽略大小写" }).check();

  const result = page.getByTestId("inline-diff");
  await expect(result.locator(".diff-inline-unchanged")).toHaveCount(4);
  await expect(result.locator(".diff-inline-modified")).toHaveCount(0);
  await expect(result.locator(".diff-pane-left")).toContainText("Hello");
  await expect(result.locator(".diff-pane-right")).toContainText("hello");
});

test("Sprint 17 工具支持深色模式", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("devtoolbox:theme", "dark"),
  );
  await openTool(page, "regex-tester");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".regex-workspace")).toBeVisible();
  await expect(page.locator(".regex-explanation-panel")).toBeVisible();
  await expect(page.locator(".regex-flavor-panel")).toBeVisible();
});

test("Sprint 17 工具在移动端无页面级横向溢出", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "移动端专属检查");
  for (const slug of ["regex-tester", "text-diff"]) {
    await openTool(page, slug);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      `${slug} should not overflow the mobile viewport`,
    ).toBe(true);
  }
});
