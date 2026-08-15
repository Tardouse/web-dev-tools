import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

async function hydrated(page: import("@playwright/test").Page) {
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
}

test("工具页面提供完整 SEO、FAQ、相关推荐与 Analytics", async (
  { page, request },
  testInfo,
) => {
  test.skip(testInfo.project.name === "mobile", "内容与接口契约由桌面项目覆盖");
  const analyticsPayloads: unknown[] = [];
  await page.route("**/api/metrics/page-view", async (route) => {
    analyticsPayloads.push(route.request().postDataJSON());
    await route.fulfill({ status: 204 });
  });

  const response = await page.goto("/zh/tools/json-formatter");
  expect(response?.status()).toBe(200);
  await hydrated(page);
  await expect(page).toHaveTitle("JSON 在线格式化 — 美化与校验 JSON | DevToolbox");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "在浏览器本地快速格式化 JSON，支持语法校验和缩进设置，数据无需上传。",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "http://127.0.0.1:3479/zh/tools/json-formatter",
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "http://127.0.0.1:3479/zh/tools/json-formatter",
  );

  const structuredData = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  const schemas = structuredData.map((value) => JSON.parse(value));
  expect(schemas.some((value) => value["@type"] === "WebApplication")).toBe(true);
  expect(
    schemas.some(
      (value) => value["@type"] === "FAQPage" && value.mainEntity.length >= 2,
    ),
  ).toBe(true);
  await expect(page.getByRole("navigation", { name: "面包屑导航" })).toContainText(
    "JSON 格式化",
  );
  await expect(page.locator(".faq-item")).toHaveCount(2);
  await expect(page.locator(".related-link")).toHaveCount(3);
  await expect.poll(() => analyticsPayloads).toContainEqual({
    path: "/zh/tools/json-formatter",
    visitorId: expect.stringMatching(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ),
  });

  const apiResponse = await request.post("/api/metrics/page-view", {
    headers: { "x-forwarded-for": "198.51.100.88" },
    data: {
      path: "/zh/tools/json-formatter",
      visitorId: randomUUID(),
    },
  });
  expect(apiResponse.status()).toBe(204);
  expect(apiResponse.headers()["ratelimit-limit"]).toBe("100");
});

test("robots、Sitemap 和全局搜索保持工具可发现", async (
  { page, request },
  testInfo,
) => {
  test.skip(testInfo.project.name === "mobile", "发现链路由桌面项目覆盖");
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  await expect(robots.text()).resolves.toContain("Disallow: /zh/admin");
  await expect(robots.text()).resolves.toContain(
    "Sitemap: http://127.0.0.1:3479/sitemap.xml",
  );

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const sitemapXml = await sitemap.text();
  expect(sitemapXml).toContain(
    "http://127.0.0.1:3479/zh/tools/json-formatter",
  );
  expect(sitemapXml).toContain(
    "http://127.0.0.1:3479/en/tools/json-formatter",
  );

  const home = await page.goto("/zh");
  expect(home?.headers()["content-security-policy"]).toContain(
    "img-src 'self' https: http: data: blob:",
  );
  await hydrated(page);
  await page.getByRole("button", { name: /搜索工具/ }).click();
  await page.getByPlaceholder("按工具、分类或任务搜索…").fill("文件与图片");
  await expect(
    page.getByRole("dialog").getByRole("button", { name: /图片工作台/ }),
  ).toBeVisible();
});
