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

test("HTTP Header 工具生成 Bearer、Basic Auth 与 API Key", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "完整 Header 生成流程由桌面项目覆盖");
  await page.goto("/zh/tools/http-header-builder");
  await hydrated(page);
  await expect(page.locator(".header-builder-output")).toContainText(
    "Authorization: Bearer demo-token",
  );

  await page.getByRole("button", { name: "Basic Auth", exact: true }).click();
  await page.getByLabel("用户名").fill("alice");
  await page.getByLabel("密码").fill("s3cret");
  await page.getByLabel("输出格式").selectOption("json");
  await expect(page.locator(".header-builder-output")).toContainText(
    '"Authorization": "Basic YWxpY2U6czNjcmV0"',
  );

  await page.getByRole("button", { name: "API Key", exact: true }).click();
  await page.getByLabel("API Key Header 名称").fill("X-Service-Key");
  await page.getByLabel("API Key 值").fill("local-key");
  await expect(page.locator(".header-builder-output")).toContainText(
    '"X-Service-Key": "local-key"',
  );

  await page.goto("/en/tools/http-header-builder");
  await expect(page.getByRole("heading", { name: "HTTP Header & Auth Builder", exact: true })).toBeVisible();
});

test("Webhook 工作台格式化 Payload 并从浏览器发送 POST", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "完整 Webhook 请求流程由桌面项目覆盖");
  await page.route("https://hooks.example.test/events", async (route) => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().headers()["x-event-type"]).toBe("order.created");
    expect(route.request().postDataJSON()).toMatchObject({
      event: "order.created",
      data: { id: 42 },
    });
    await route.fulfill({
      status: 202,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify({ accepted: true, deliveryId: "delivery-10" }),
    });
  });
  await page.goto("/zh/tools/webhook-tester");
  await hydrated(page);
  await page.getByRole("button", { name: "格式化", exact: true }).click();
  await expect(page.getByLabel("Payload")).toHaveValue(/\n  "event": "order\.created"/);
  await page.getByLabel("代码格式").selectOption("axios");
  await expect(page.locator(".api-code-output")).toContainText('"data"');
  await expect(page.locator(".api-code-output")).not.toContainText('"body"');
  await page.getByRole("button", { name: "发送 Webhook", exact: true }).click();
  await expect(page.locator(".api-response-meta")).toContainText("202");
  await expect(page.getByLabel("响应 Body")).toContainText('"accepted":true');
  await page.getByLabel("Payload").fill("x".repeat(1024 * 1024 + 1));
  await page.getByRole("button", { name: "格式化", exact: true }).click();
  await expect(page.locator(".webhook-workbench .error-banner")).toContainText(
    "此工具的上限为",
  );
});

test("Sprint 10 工具在移动端长值状态下无横向溢出", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "移动端专属检查");
  await page.goto("/zh/tools/http-header-builder");
  await hydrated(page);
  await page.getByLabel("Bearer Token").fill("token-".repeat(48));
  await expect(page.locator(".header-builder-output")).toContainText("Bearer token-token");
  await expectNoOverflow(page);

  await page.goto("/zh/tools/webhook-tester");
  await hydrated(page);
  await page.getByLabel("Webhook URL").fill(
    "https://hooks.example.test/teams/platform/deliveries/order-created",
  );
  await page.getByLabel("Payload").fill(
    JSON.stringify({ event: "order.created", reference: "ref-".repeat(80) }),
  );
  await expect(page.locator(".api-code-output")).toContainText("order.created");
  await expectNoOverflow(page);
});
