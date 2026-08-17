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

function metric(page: Page, label: string) {
  return page.locator(".metric").filter({
    has: page.getByText(label, { exact: true }),
  });
}

test("数据大小工具区分 bit、Byte、SI 与 IEC 单位", async ({ page }) => {
  await installWorkerProbe(page);
  await openTool(page, "data-size-converter");

  await page.getByLabel("数据大小数值").fill("8");
  await page.getByLabel("数据大小原单位").selectOption("bit");
  await expect(metric(page, "B").locator(".metric-value")).toHaveText("1");
  await expect(metric(page, "KB").locator(".metric-value")).toHaveText("0.001");
  await expectWorker(page, "data-size-convert");

  await page.getByLabel("数据大小数值").fill("1");
  await page.getByLabel("数据大小原单位").selectOption("GiB");
  await expect(metric(page, "MiB").locator(".metric-value")).toHaveText(
    "1,024",
  );
  await expect(metric(page, "GB").locator(".metric-value")).toHaveText(
    "1.073741824",
  );

  await page.getByLabel("数据大小数值").fill("-1");
  await expect(page.locator(".error-banner[role='alert']")).toContainText(
    "请输入非负且有限的数据大小",
  );
});

test("文本统计与大小写转换覆盖英文字符和首字母大写", async ({ page }) => {
  await installWorkerProbe(page);
  await openTool(page, "text-counter");
  await page.getByLabel("输入或粘贴文本进行分析…").fill("ABC 世界 123");
  await expect(metric(page, "英文字符").locator(".metric-value")).toHaveText(
    "3",
  );
  await expectWorker(page, "text-count");

  await openTool(page, "case-converter");
  await page.getByLabel("转换格式").selectOption("capitalize");
  await page.getByLabel("输入").fill("  hello WORLD");
  await page.getByRole("button", { name: "转换", exact: true }).click();
  await expect(page.locator(".editor-output")).toHaveText("  Hello WORLD");
  await expectWorker(page, "case-convert");
});

test("行工具支持清理、自然排序、反转及行号往返", async ({ page }) => {
  await installWorkerProbe(page);
  await openTool(page, "line-cleaner");
  await page.getByLabel("待清理文本").fill("alpha\n\nalpha\nbeta\n  ");
  await page.getByRole("button", { name: "清理文本" }).click();
  await expect(page.locator(".editor-output")).toHaveText("alpha\nbeta");
  await expectWorker(page, "line-clean");

  await openTool(page, "line-sorter");
  await page.getByLabel("待处理行").fill("item10\nitem2\nitem1");
  await page.getByRole("button", { name: "处理行" }).click();
  await expect(page.locator(".editor-output")).toHaveText(
    "item1\nitem2\nitem10",
  );
  await expectWorker(page, "line-sort");
  await page.getByLabel("排序方式").selectOption("reverse");
  await page.getByLabel("待处理行").fill("one\ntwo\nthree");
  await page.getByRole("button", { name: "处理行" }).click();
  await expect(page.locator(".editor-output")).toHaveText("three\ntwo\none");

  await openTool(page, "line-numberer");
  await page.getByLabel("起始行号").fill("8");
  await page.getByRole("checkbox", { name: "补零对齐" }).check();
  await page.getByLabel("文本行").fill("alpha\nbeta\ngamma");
  await page.getByRole("button", { name: "添加行号" }).click();
  await expect(page.locator(".editor-output")).toHaveText(
    "08. alpha\n09. beta\n10. gamma",
  );
  await expectWorker(page, "line-number");
  await page.getByRole("button", { name: "删除", exact: true }).click();
  await page.getByLabel("文本行").fill("1. alpha\n2: beta\n3\tgamma");
  await page.getByRole("button", { name: "删除行号" }).click();
  await expect(page.locator(".editor-output")).toHaveText("alpha\nbeta\ngamma");
});

test("文本去重、合并与拆分支持主要模式", async ({ page }) => {
  await installWorkerProbe(page);
  await openTool(page, "text-deduplicator");
  await page.getByLabel("待去重文本").fill("one two one THREE three");
  await page.getByRole("checkbox", { name: "区分大小写" }).uncheck();
  await page.getByRole("button", { name: "去重", exact: true }).click();
  await expect(page.locator(".editor-output")).toHaveText("one two THREE");
  await expectWorker(page, "text-deduplicate");

  await openTool(page, "text-merger");
  await page.getByRole("button", { name: "交错行" }).click();
  await page.getByLabel("文本 A").fill("A1\nA2");
  await page.getByLabel("文本 B").fill("B1\nB2\nB3");
  await page.getByRole("button", { name: "合并文本" }).click();
  await expect(page.locator(".text-merge-output .editor-output")).toHaveText(
    "A1\nB1\nA2\nB2\nB3",
  );
  await expectWorker(page, "text-merge");

  await openTool(page, "text-splitter");
  await page.getByLabel("拆分分隔方式").selectOption("custom");
  await page.getByLabel("自定义拆分分隔符").fill("::");
  await page.getByLabel("拆分输出格式").selectOption("json");
  await page.getByLabel("待拆分文本").fill("one::two::::three");
  await page.getByRole("button", { name: "拆分文本" }).click();
  await expect(page.locator(".editor-output")).toHaveText(
    '[\n  "one",\n  "two",\n  "three"\n]',
  );
  await expectWorker(page, "text-split");
});

test("Sprint 16 工具支持深色模式", async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      message.text().toLowerCase().includes("hydrat")
    ) {
      hydrationErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    if (error.message.toLowerCase().includes("hydrat")) {
      hydrationErrors.push(error.message);
    }
  });
  await page.addInitScript(() =>
    localStorage.setItem("devtoolbox:theme", "dark"),
  );
  await openTool(page, "text-merger");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".text-merge-workspace")).toBeVisible();
  expect(hydrationErrors).toEqual([]);
});

test("Sprint 16 工具在移动端无页面级横向溢出", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "移动端专属检查");
  for (const slug of [
    "data-size-converter",
    "text-counter",
    "case-converter",
    "line-cleaner",
    "line-sorter",
    "line-numberer",
    "text-deduplicator",
    "text-merger",
    "text-splitter",
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
