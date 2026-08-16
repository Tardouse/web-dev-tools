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

test("JSON 可在 Worker 中转换为 YAML、XML 和安全 CSV", async ({ page }) => {
  await installWorkerProbe(page);

  await openTool(page, "json-to-yaml");
  await page
    .getByLabel("JSON 输入")
    .fill('{"project":"DevToolbox","ready":true,"tags":["json","yaml"]}');
  await page.getByRole("button", { name: "转换为 YAML" }).click();
  await expect(page.locator(".editor-output")).toContainText(
    "project: DevToolbox",
  );
  await expect(page.locator(".editor-output")).toContainText("- yaml");
  await expectWorker(page, "json-to-yaml");

  await openTool(page, "json-to-xml");
  await page
    .getByLabel("JSON 输入")
    .fill('{"message":"<safe> & useful","items":[1,null]}');
  await page.getByRole("button", { name: "转换为 XML" }).click();
  await expect(page.locator(".editor-output")).toContainText(
    '<property name="message" type="string">',
  );
  await expect(page.locator(".editor-output")).toContainText(
    "&lt;safe&gt; &amp; useful",
  );
  await expectWorker(page, "json-to-xml");

  await openTool(page, "json-to-csv");
  await page
    .getByLabel("JSON 输入")
    .fill('[{"name":"=2+2","meta":{"active":true}},{"name":"Ada","score":9}]');
  await page.getByRole("button", { name: "转换为 CSV" }).click();
  await expect(page.locator(".editor-output")).toContainText("name,meta,score");
  await expect(page.locator(".editor-output")).toContainText("'=2+2");
  await expect(page.locator(".editor-output")).toContainText(
    '"{""active"":true}"',
  );
  await expectWorker(page, "json-to-csv");
});

test("JSON Tree Viewer 支持展开、路径复制、折叠和分页", async ({ page }) => {
  await installWorkerProbe(page);
  await openTool(page, "json-tree-viewer");
  const input = page.getByLabel("JSON 输入");
  await input.fill(
    '{"profile":{"name":"Ada","contact":{"email":"ada@example.com"}},"items":[1,2]}',
  );
  await expect(page.getByText("8 个节点", { exact: true })).toBeVisible();
  await expectWorker(page, "json-tree");

  await page.getByRole("button", { name: "展开 $.profile" }).click();
  await page.getByRole("button", { name: "展开 $.profile.contact" }).click();
  await expect(
    page.locator(".json-tree-key").filter({ hasText: "email" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "复制路径 $.profile.contact.email" })
    .click();
  await expect(
    page.getByText("已复制路径 $.profile.contact.email", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "全部折叠" }).click();
  await expect(page.locator(".json-tree-row")).toHaveCount(1);

  await input.fill(
    JSON.stringify(Array.from({ length: 105 }, (_, index) => index)),
  );
  await expect(page.getByText("106 个节点", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "展开 $", exact: true }).click();
  await expect(page.locator(".json-tree-row")).toHaveCount(101);
  await page.getByRole("button", { name: "再显示 5 项" }).click();
  await expect(page.locator(".json-tree-row")).toHaveCount(106);

  await input.fill('{"broken":');
  await expect(page.locator(".error-banner[role='alert']")).toContainText(
    "JSON 无效",
  );
});

test("Sprint 14 工具在移动端无页面级横向溢出", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "移动端专属检查");
  for (const slug of [
    "json-to-yaml",
    "json-to-xml",
    "json-to-csv",
    "json-tree-viewer",
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
