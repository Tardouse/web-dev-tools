import { expect, test } from "@playwright/test";

const adminUsername = "admin";
const adminPassword = "E2e-Admin-Password-2026!";

async function hydrated(page: import("@playwright/test").Page) {
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
}

async function adminLogin(page: import("@playwright/test").Page) {
  await page.goto("/zh/admin/login");
  await hydrated(page);
  await page.getByLabel("用户名").fill(adminUsername);
  await page.getByLabel("密码").fill(adminPassword);
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/zh\/admin$/);
}

async function expectNoOverflow(page: import("@playwright/test").Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
}

test("工具管理覆盖新增、执行、访问策略、禁用和删除", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "完整变更流程由桌面项目覆盖");
  const slug = "sprint7-team-json";
  await adminLogin(page);
  await page.goto("/zh/admin/tools/new");
  await hydrated(page);
  await page.getByLabel("Slug").fill(slug);
  await page.getByLabel("实现引擎").selectOption("json-formatter");
  await page.getByLabel("英文名称").fill("Sprint 7 Team JSON");
  await page.getByLabel("中文名称").fill("Sprint 7 团队 JSON");
  await page.getByLabel("英文短名称").fill("Team JSON");
  await page.getByLabel("中文短名称").fill("团队 JSON");
  await page
    .getByLabel("英文 Description")
    .fill("Format shared team JSON with the production formatter engine.");
  await page
    .getByLabel("中文 Description")
    .fill("使用生产格式化引擎处理团队共享的 JSON 数据。");
  await page.getByLabel("分类").selectOption("json-data");
  await page.getByLabel("排序值").fill("12");
  await page.getByLabel("英文关键词（逗号分隔）").fill("json, sprint, team");
  await page.getByLabel("中文关键词（逗号分隔）").fill("json, 团队, 格式化");
  await page.getByLabel("英文 SEO 标题").fill("Sprint 7 Team JSON Formatter");
  await page.getByLabel("中文 SEO 标题").fill("Sprint 7 团队 JSON 格式化");
  await page
    .getByLabel("英文 SEO 描述")
    .fill("Format shared JSON locally with the team formatter.");
  await page
    .getByLabel("中文 SEO 描述")
    .fill("在浏览器本地格式化团队共享的 JSON 数据。");
  await page.getByLabel("最大输入（MB）").fill("0.001");
  await page.getByLabel("最大输出（MB）").fill("0.005");
  await page.getByLabel("最大执行时间（秒）").fill("5");
  await page.getByLabel("最大并发数").fill("1");
  await page.getByLabel("推荐工具").check();
  await page.getByRole("button", { name: "保存工具" }).click();
  await expect(page).toHaveURL(new RegExp(`/zh/admin/tools/${slug}$`));
  await expect(page.getByLabel("最大输入（MB）")).toHaveValue("0.001");
  await expect(page.getByLabel("最大输出（MB）")).toHaveValue("0.005");
  await expect(page.getByLabel("最大执行时间（秒）")).toHaveValue("5");
  await expect(page.getByLabel("最大并发数")).toHaveValue("1");

  await page.goto(`/en/tools?created=${slug}`);
  await hydrated(page);
  await page.getByPlaceholder("Filter tools…").fill("团队");
  await expect(
    page.getByRole("heading", { name: "Sprint 7 Team JSON" }),
  ).toBeVisible();
  await page.goto(`/zh/tools/${slug}`);
  await hydrated(page);
  await expect(
    page.getByRole("heading", { name: "Sprint 7 团队 JSON", level: 1 }),
  ).toBeVisible();
  await page.getByLabel("输入").fill('{"sprint":7}');
  await page.getByRole("button", { name: "格式化 JSON" }).click();
  await expect(page.locator(".editor-output")).toContainText('"sprint": 7');

  await page.goto(`/zh/admin/tools/${slug}`);
  await page.getByLabel("需要登录").check();
  await page.getByRole("button", { name: "保存工具" }).click();
  await expect(page.getByText("工具配置已保存。")).toBeVisible();
  await page.goto(`/zh/tools/${slug}`);
  await expect(page).toHaveURL(/\/zh\/login$/);

  await page.goto(`/zh/admin/tools/${slug}`);
  await page.getByLabel("需要登录").uncheck();
  await page.getByLabel("允许免费使用").uncheck();
  await page.getByRole("button", { name: "保存工具" }).click();
  await expect(page.getByText("工具配置已保存。")).toBeVisible();
  await page.goto(`/zh/tools/${slug}`);
  await expect(
    page.getByRole("heading", { name: "此工具需要付费权限" }),
  ).toBeVisible();

  await page.goto(`/zh/admin/tools/${slug}`);
  await page.getByLabel("启用工具").uncheck();
  await page.getByRole("button", { name: "保存工具" }).click();
  await expect(page.getByText("工具配置已保存。")).toBeVisible();
  await page.goto(`/zh/tools/${slug}`);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(
    page.getByText("未找到您访问的工具或页面。", { exact: false }),
  ).toBeVisible();

  await page.goto(`/zh/admin/tools/${slug}`);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "删除自定义工具" }).click();
  await expect(page).toHaveURL(/\/zh\/admin\/tools$/);
  await expect(page.getByText(slug, { exact: false })).toHaveCount(0);
});

test("系统设置实时控制公开站点并可安全恢复", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "完整变更流程由桌面项目覆盖");
  await adminLogin(page);
  await page.goto("/zh/admin/settings");
  await hydrated(page);
  await page.getByLabel("网站名称").fill("Sprint 7 Toolbox");
  await page.getByLabel("中文 Footer").fill("Sprint 7 动态页脚");
  await page.getByLabel("开放用户注册").uncheck();
  await page.getByLabel("要求邮箱验证").uncheck();
  await page.getByLabel("显示广告位").check();
  await page.getByLabel("文件上传限制（MB）").fill("0.001");
  await page.getByRole("button", { name: "保存系统设置" }).click();
  await expect(page.getByText("系统设置已保存并生效。")).toBeVisible();

  await page.goto("/zh");
  await hydrated(page);
  await expect(page.locator("header .logo")).toContainText("Sprint 7 Toolbox");
  await expect(page.locator(".footer-bottom")).toContainText(
    "Sprint 7 动态页脚",
  );
  await page.goto("/zh/register");
  await expect(page.getByText("当前已暂停新用户注册。")).toBeVisible();
  await page.goto("/zh/verify-email");
  await expect(page.getByText("当前无需验证邮箱，可直接登录。")).toBeVisible();
  await page.goto("/zh/tools/file-inspector");
  await expect(page.locator(".workspace-header .badge")).toHaveText("1.0 KB");
  await expect(page.locator(".ad-slot")).toBeVisible();

  await page.goto("/zh/admin/settings");
  await page.getByLabel("维护模式").check();
  await page.getByRole("button", { name: "保存系统设置" }).click();
  await expect(page.getByText("系统设置已保存并生效。")).toBeVisible();
  await page.goto("/zh");
  await expect(page.getByRole("heading", { name: "网站维护中" })).toBeVisible();

  await page.goto("/zh/admin/settings");
  await page.getByLabel("网站名称").fill("DevToolbox");
  await page.getByLabel("Logo 文字").fill("</>");
  await page.getByLabel("Logo URL（可选）").fill("");
  await page
    .getByLabel("中文 Description")
    .fill("打开即用、快速且隐私优先的在线开发工具箱。");
  await page
    .getByLabel("English Description")
    .fill(
      "Fast, private developer utilities for formatting, encoding, testing, and everyday engineering work.",
    );
  await page.getByLabel("中文 Footer").fill("快速、隐私优先的日常开发工具。");
  await page
    .getByLabel("英文 Footer")
    .fill("Fast, private utilities for everyday development work.");
  await page.getByLabel("ICP / 法律信息").fill("");
  await page.getByLabel("联系邮箱").fill("");
  await page.getByLabel("开放用户注册").check();
  await page.getByLabel("要求邮箱验证").check();
  await page.getByLabel("维护模式").uncheck();
  await page.getByLabel("显示广告位").uncheck();
  await page.getByLabel("默认工具限制（MB）").fill("1");
  await page.getByLabel("文件上传限制（MB）").fill("50");
  await page.getByLabel("匿名 API 限额").fill("100");
  await page.getByLabel("登录用户 API 限额").fill("500");
  await page.getByRole("button", { name: "保存系统设置" }).click();
  await expect(page.getByText("系统设置已保存并生效。")).toBeVisible();
  await page.goto("/zh");
  await expect(
    page.getByRole("heading", { name: "常用开发工具，打开即用。" }),
  ).toBeVisible();
});

test("移动端工具与设置后台无横向溢出", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "移动端专属检查");
  await adminLogin(page);
  await page.goto("/zh/admin/tools");
  await hydrated(page);
  await expect(page.getByRole("heading", { name: "工具管理" })).toBeVisible();
  await expectNoOverflow(page);
  await page.goto("/zh/admin/tools/new");
  await expect(page.getByRole("heading", { name: "新增工具" })).toBeVisible();
  await expectNoOverflow(page);
  await page.goto("/zh/admin/settings");
  await expect(page.getByRole("heading", { name: "系统设置" })).toBeVisible();
  await expectNoOverflow(page);
});
