import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const adminUsername = "admin";
const adminPassword = "E2e-Admin-Password-2026!";
const userPassword = "Member-Password-2026!";
const resetPassword = "Reset-Member-Password-2026!";
const outboxPath = resolve(".tmp/e2e-data/mail-outbox.jsonl");

function projectEmail(project: string) {
  return `member-${project}@example.com`;
}

async function waitForAccountEmail(
  to: string,
  purpose: "email_verification" | "password_reset",
): Promise<string> {
  let link = "";
  await expect.poll(async () => {
    try {
      const messages = (await readFile(outboxPath, "utf8"))
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as { to: string; purpose: string; link: string });
      link = messages.reverse().find((message) => message.to === to && message.purpose === purpose)?.link ?? "";
      return link.length > 0;
    } catch {
      return false;
    }
  }).toBe(true);
  return link;
}

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

  test("a normal user verifies email before signing in", async ({ page }, testInfo) => {
    const userEmail = projectEmail(testInfo.project.name);
    await page.goto("/zh/register"); await hydrated(page);
    await page.getByLabel("姓名").fill("普通用户");
    await page.getByLabel("邮箱").fill(userEmail);
    await page.getByLabel("密码", { exact: true }).fill(userPassword);
    await page.getByLabel("确认密码").fill(userPassword);
    await page.getByRole("button", { name: "创建账号" }).click();
    await expect(page).toHaveURL(/\/zh\/verify-email\?sent=1$/);
    await expect(page.getByText("账号已创建，验证邮件已发送。")).toBeVisible();
    const verificationLink = await waitForAccountEmail(userEmail, "email_verification");
    await page.goto(verificationLink); await hydrated(page);
    await page.getByRole("button", { name: "验证邮箱" }).click();
    await expect(page).toHaveURL(/\/zh\/login\?verified=1$/);
    await expect(page.getByText("邮箱验证成功，现在可以登录。")).toBeVisible();
    await page.getByLabel("邮箱").fill(userEmail);
    await page.getByLabel("密码").fill(userPassword);
    await page.getByRole("button", { name: "登录", exact: true }).click();
    await expect(page).toHaveURL(/\/zh\/account$/);
    await expect(page.getByRole("heading", { name: "普通用户" })).toBeVisible();
    await page.getByRole("button", { name: "退出登录" }).click();
  });

  test("a verified user can sign in by email", async ({ page }, testInfo) => {
    const userEmail = projectEmail(testInfo.project.name);
    await page.goto("/zh/login"); await hydrated(page);
    await page.getByLabel("邮箱").fill(userEmail);
    await page.getByLabel("密码").fill(userPassword);
    await page.getByRole("button", { name: "登录", exact: true }).click();
    await expect(page).toHaveURL(/\/zh\/account$/);
  });

  test("normal user sessions cannot authorize the admin console", async ({ page }, testInfo) => {
    const userEmail = projectEmail(testInfo.project.name);
    await page.goto("/zh/login"); await hydrated(page);
    await page.getByLabel("邮箱").fill(userEmail);
    await page.getByLabel("密码").fill(userPassword);
    await page.getByRole("button", { name: "登录", exact: true }).click();
    await page.goto("/zh/admin");
    await expect(page).toHaveURL(/\/zh\/admin\/login$/);
    await expect(page.getByRole("heading", { name: "管理认证" })).toBeVisible();
  });

  test("a user can recover a password with a single-use email link", async ({ page }, testInfo) => {
    const userEmail = projectEmail(testInfo.project.name);
    await page.goto("/zh/forgot-password"); await hydrated(page);
    await page.getByLabel("邮箱").fill(userEmail);
    await page.getByRole("button", { name: "发送重置邮件" }).click();
    await expect(page.getByText("如果该邮箱对应可用账号，我们已发送密码重置邮件。")).toBeVisible();
    const resetLink = await waitForAccountEmail(userEmail, "password_reset");
    await page.goto(resetLink); await hydrated(page);
    await page.getByLabel("新密码", { exact: true }).fill(resetPassword);
    await page.getByLabel("确认新密码").fill(resetPassword);
    await page.getByRole("button", { name: "设置新密码" }).click();
    await expect(page).toHaveURL(/\/zh\/login\?reset=1$/);
    await expect(page.getByText("密码已重置，请使用新密码登录。")).toBeVisible();

    await page.getByLabel("邮箱").fill(userEmail);
    await page.getByLabel("密码").fill(userPassword);
    await page.getByRole("button", { name: "登录", exact: true }).click();
    await expect(page.locator(".form-error")).toContainText("邮箱或密码不正确");
    await expect(page.getByLabel("邮箱")).toHaveValue(userEmail);
    await page.getByLabel("密码").fill(resetPassword);
    await page.getByRole("button", { name: "登录", exact: true }).click();
    await expect(page).toHaveURL(/\/zh\/account$/);

    await page.goto(resetLink); await hydrated(page);
    await expect(page.getByText("重置链接已经使用，请重新申请。")).toBeVisible();
  });

  test("administrator signs in by username and no email is shown", async ({ page }) => {
    await adminLogin(page);
    await expect(page.getByText(adminUsername, { exact: true })).toBeVisible();
    await expect(page.getByText(/admin@/)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "管理后台" })).toBeVisible();
  });

  test("administrator can create a normal user with a temporary password", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "mobile admin dialogs are covered in Sprint 7");
    await adminLogin(page);
    await page.goto("/zh/admin/users");
    await page.getByRole("button", { name: "创建用户" }).click();
    await page.getByLabel("姓名").fill("后台创建用户");
    await page.getByLabel("邮箱").fill(`managed-${testInfo.project.name}@example.com`);
    await page.getByRole("button", { name: "创建", exact: true }).click();
    await expect(page.getByText("临时密码（仅显示一次）")).toBeVisible();
    await expect(page.locator(".temporary-password code")).not.toBeEmpty();
  });
});
