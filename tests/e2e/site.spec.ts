import { expect, test } from "@playwright/test";

async function waitForHydration(page: import("@playwright/test").Page) {
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
}

test.beforeEach(async ({ page }) => {
  await page.goto("/zh");
  await waitForHydration(page);
});

test("中文首页可搜索并打开工具", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "常用开发工具，打开即用。" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /您想完成什么/ }).click();
  await page.getByPlaceholder("按工具、分类或任务搜索…").fill("JSON 格式化");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /JSON 格式化/ })
    .click();
  await expect(page).toHaveURL(/\/zh\/tools\/json-formatter$/);
  await expect(
    page.getByRole("heading", { name: "JSON 格式化", level: 1, exact: true }),
  ).toBeVisible();
});

test("中文 JSON 工具在本地处理并显示中文错误", async ({ page }) => {
  await page.goto("/zh/tools/json-formatter");
  await waitForHydration(page);
  const input = page.getByLabel("输入");
  await input.fill('{"你好":"世界","items":[1,2]}');
  await page.getByRole("button", { name: "格式化 JSON" }).click();
  await expect(
    page.getByLabel("工作区").locator(".editor-output"),
  ).toContainText('"你好": "世界"');
  await input.fill('{"错误":');
  await page.getByRole("button", { name: "格式化 JSON" }).click();
  await expect(page.getByLabel("工作区").getByRole("alert")).toContainText(
    "JSON 无效",
  );
});

test("语言切换保持当前工具并持久化选择", async ({ page }) => {
  await page.goto("/zh/tools/base64");
  await waitForHydration(page);
  await page.getByRole("button", { name: "Switch to English" }).click();
  await expect(page).toHaveURL(/\/en\/tools\/base64$/);
  await expect(
    page.getByRole("heading", { name: "Base64 Encoder / Decoder", level: 1 }),
  ).toBeVisible();
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
});

test("英文关键词在中文站点也能搜索", async ({ page }) => {
  await page.goto("/zh/tools");
  await waitForHydration(page);
  await page.getByPlaceholder("筛选工具…").fill("regex tester");
  await expect(
    page.getByRole("heading", { name: "正则表达式测试" }),
  ).toBeVisible();
});

test("中文主题和收藏在移动端可用", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "移动端专属检查");
  await page.goto("/zh/tools/base64");
  await waitForHydration(page);
  await page.getByRole("button", { name: "切换到深色模式" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: /收藏Base64/ }).click();
  await page.goto("/zh/favorites");
  await expect(
    page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "收藏工具" }) })
      .getByRole("heading", { name: "Base64 编码 / 解码" }),
  ).toBeVisible();
});

test("英文站点保持可用", async ({ page }) => {
  await page.goto("/en");
  await waitForHydration(page);
  await expect(
    page.getByRole("heading", { name: "Everyday tools, ready when you are." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "All tools", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/en\/tools$/);
});

test("健康接口和安全响应头可用", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toMatchObject({
    status: "ok",
    service: "web-dev-tools",
  });
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
});
