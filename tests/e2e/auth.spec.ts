import { expect, test } from "@playwright/test";

const adminUsername = "admin";
const adminPassword = "E2e-Admin-Password-2026!";
const userEmail = "member@example.com";
const userPassword = "Member-Password-2026!";

async function hydrated(page: import("@playwright/test").Page) {
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
}
async function adminLogin(page: import("@playwright/test").Page, locale = "zh") {
  await page.goto(`/${locale}/admin/login`); await hydrated(page);
  await page.getByLabel(locale === "zh" ? "用户名" : "Username").fill(adminUsername);
  await page.getByLabel(locale === "zh" ? "密码" : "Password").fill(adminPassword);
  await page.getByRole("button", { name: locale === "zh" ? "登录" : "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/admin$`));
}

test.describe.serial("separated user and admin authentication", () => {
  test("public UI exposes user login but no administration entry", async ({ page }) => {
    await page.goto("/zh"); await hydrated(page);
    await expect(page.locator('a.account-link[href="/zh/login"]')).toHaveCount(1);
    await expect(page.getByText("管理后台", { exact: true })).toHaveCount(0);
    await expect(page.locator('a[href*="/admin"]')).toHaveCount(0);
  });

  test("a normal user can register, sign out, and sign in by email", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "shared registration account is created once");
    await page.goto("/zh/register"); await hydrated(page);
    await page.getByLabel("姓名").fill("普通用户");
    await page.getByLabel("邮箱").fill(userEmail);
    await page.getByLabel("密码", { exact: true }).fill(userPassword);
    await page.getByLabel("确认密码").fill(userPassword);
    await page.getByRole("button", { name: "创建账号" }).click();
    await expect(page).toHaveURL(/\/zh\/account$/);
    await expect(page.getByRole("heading", { name: "普通用户" })).toBeVisible();
    await page.getByRole("button", { name: "退出登录" }).click();
    await page.goto("/zh/login"); await hydrated(page);
    await page.getByLabel("邮箱").fill(userEmail);
    await page.getByLabel("密码").fill(userPassword);
    await page.getByRole("button", { name: "登录", exact: true }).click();
    await expect(page).toHaveURL(/\/zh\/account$/);
  });

  test("normal user sessions cannot authorize the admin console", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "user account is created by desktop project");
    await page.goto("/zh/login"); await hydrated(page);
    await page.getByLabel("邮箱").fill(userEmail);
    await page.getByLabel("密码").fill(userPassword);
    await page.getByRole("button", { name: "登录", exact: true }).click();
    await page.goto("/zh/admin");
    await expect(page).toHaveURL(/\/zh\/admin\/login$/);
    await expect(page.getByRole("heading", { name: "管理认证" })).toBeVisible();
  });

  test("administrator signs in by username and no email is shown", async ({ page }) => {
    await adminLogin(page);
    await expect(page.getByText(adminUsername, { exact: true })).toBeVisible();
    await expect(page.getByText(/admin@/)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "管理后台" })).toBeVisible();
  });

  test("administrator can create a normal user with a temporary password", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "creation flow is covered once against shared database");
    await adminLogin(page);
    await page.goto("/zh/admin/users");
    await page.getByRole("button", { name: "创建用户" }).click();
    await page.getByLabel("姓名").fill("后台创建用户");
    await page.getByLabel("邮箱").fill("managed@example.com");
    await page.getByRole("button", { name: "创建", exact: true }).click();
    await expect(page.getByText("临时密码（仅显示一次）")).toBeVisible();
    await expect(page.locator(".temporary-password code")).not.toBeEmpty();
  });
});
