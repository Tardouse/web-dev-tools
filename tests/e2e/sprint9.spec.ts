import { expect, test } from "@playwright/test";

async function hydrated(page: import("@playwright/test").Page) {
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
}

async function expectNoOverflow(page: import("@playwright/test").Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
}

test("SQL 与 Web 代码工具使用语法解析器完成本地处理", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "完整代码处理流程由桌面项目覆盖");
  await page.goto("/zh/tools/sql-formatter");
  await hydrated(page);
  await page.getByLabel("输入").fill("select id,name from users where active=true");
  await page.getByLabel("SQL 方言").selectOption("postgresql");
  await page.getByRole("button", { name: "格式化 SQL" }).click();
  await expect(page.locator(".editor-output")).toContainText("SELECT");
  await expect(page.locator(".editor-output")).toContainText("FROM");
  await page.getByLabel("输入").fill("x".repeat(1024 * 1024 + 1));
  await page.getByRole("button", { name: "格式化 SQL" }).click();
  await expect(page.locator(".tool-workspace .error-banner")).toContainText(
    "此工具的上限为",
  );

  await page.goto("/zh/tools/css-formatter");
  await hydrated(page);
  await page.getByLabel("操作").selectOption("minify");
  await page.getByLabel("输入").fill(".app { color: red; margin: 0px; }");
  await page.getByRole("button", { name: "压缩", exact: true }).click();
  await expect(page.locator(".editor-output")).toContainText(".app{color:red;margin:0}");

  await page.goto("/zh/tools/html-formatter");
  await hydrated(page);
  await page.getByLabel("操作").selectOption("encode");
  await page.getByLabel("输入").fill("<span>Hi & bye</span>");
  await page.getByRole("button", { name: "Entity 编码" }).click();
  await expect(page.locator(".editor-output")).toContainText("&lt;span&gt;Hi &amp; bye&lt;/span&gt;");
});

test("Git、网络与命令速查覆盖日常开发流程", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "完整开发工具流程由桌面项目覆盖");
  await page.goto("/zh/tools/git-command-builder");
  await hydrated(page);
  await page.getByRole("tab", { name: "分支名" }).click();
  await page.getByLabel("简短描述").fill("Sprint Nine Tools");
  await expect(page.locator(".developer-output")).toContainText(
    "feature/sprint-nine-tools",
  );
  await page.getByRole("tab", { name: "URL 解析" }).click();
  await page.getByLabel("仓库 URL").fill("git@github.com:acme/platform.git");
  await expect(page.locator(".developer-output")).toContainText(
    '"repository": "platform"',
  );

  await page.goto("/zh/tools/network-calculator");
  await hydrated(page);
  await page.getByLabel("网络值").fill("10.20.30.42/20");
  await expect(page.getByText("10.20.16.0/20", { exact: true })).toBeVisible();
  await expect(page.getByText("255.255.240.0", { exact: true })).toBeVisible();
  await page.getByLabel("网络值").fill("2001:db8:85a3::8a2e:370:7334/64");
  await expect(page.locator(".network-workbench .badge")).toHaveText("IPV6");
  await expect(page.getByText("2001:db8:85a3:0:0:0:0:0/64", { exact: true })).toBeVisible();
  await expect(page.getByText("2^64", { exact: true })).toBeVisible();

  await page.goto("/zh/tools/docker-cheatsheet");
  await page.getByLabel("搜索 Docker 命令").fill("compose");
  await expect(page.getByText("docker compose up --detach --build", { exact: true })).toBeVisible();
});

test("API 工作台生成代码并从浏览器发送受限请求", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "完整 API 请求流程由桌面项目覆盖");
  await page.route("https://api.example.test/v1/items", async (route) => {
    await route.fulfill({
      status: 201,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
        "x-request-id": "sprint-9",
      },
      body: JSON.stringify({ created: true, id: 9 }),
    });
  });
  await page.goto("/zh/tools/api-request-builder");
  await hydrated(page);
  await expect(page.locator(".api-code-output")).toContainText("curl -X POST");
  await page.getByRole("button", { name: "发送" }).click();
  await expect(page.locator(".api-response-meta")).toContainText("201");
  await expect(page.getByLabel("响应 Body")).toContainText('"created":true');
  await page.getByLabel("代码格式").selectOption("axios");
  await expect(page.locator(".api-code-output")).toContainText('"data"');
  await expect(page.locator(".api-code-output")).not.toContainText('"body"');
});

test("Sprint 9 工具在移动端无横向溢出", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "移动端专属检查");
  for (const path of [
    "/zh/tools/sql-formatter",
    "/zh/tools/git-command-builder",
    "/zh/tools/network-calculator",
    "/zh/tools/api-request-builder",
    "/zh/tools/docker-cheatsheet",
  ]) {
    await page.goto(path);
    await hydrated(page);
    await expect(page.locator(".tool-workspace")).toBeVisible();
    if (path.endsWith("network-calculator")) {
      await page.getByLabel("网络值").fill("2001:db8:85a3::8a2e:370:7334/64");
      await expect(page.locator(".network-workbench .badge")).toHaveText("IPV6");
    }
    await expectNoOverflow(page);
  }
});
