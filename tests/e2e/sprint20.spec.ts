import { expect, test, type Page } from "@playwright/test";
import QRCode from "qrcode";

async function openQrTool(page: Page) {
  await page.goto("/zh/tools/qr-code-generator");
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
  await expect(page.locator(".qr-output img")).toBeVisible();
}

async function openPayload(page: Page) {
  await page.getByText("编码后的内容", { exact: true }).click();
  return page.locator(".qr-payload-output");
}

test("二维码工具生成 WiFi、Email 和 vCard 模板", async ({ page }) => {
  await openQrTool(page);

  await page.getByRole("tab", { name: "WiFi", exact: true }).click();
  await page.getByLabel("网络名称（SSID）").fill("Dev Network");
  await page.getByLabel("WiFi 密码").fill("secret-pass");
  const wifiPayload = await openPayload(page);
  await expect(wifiPayload).toContainText(
    "WIFI:T:WPA;S:Dev Network;P:secret-pass;H:false;;",
  );

  await page.getByRole("tab", { name: "Email", exact: true }).click();
  await page.getByLabel("收件人邮箱").fill("dev@example.com");
  await page.getByLabel("主题").fill("Build status");
  await page.getByLabel("正文").fill("The build is green.");
  const emailPayload = await openPayload(page);
  await expect(emailPayload).toContainText(
    "mailto:dev@example.com?subject=Build+status&body=The+build+is+green.",
  );

  await page.getByRole("tab", { name: "vCard", exact: true }).click();
  await page.getByLabel("名").fill("Ada");
  await page.getByLabel("姓").fill("Lovelace");
  await page.getByLabel("组织").fill("Analytical Engine Lab");
  const vcardPayload = await openPayload(page);
  await expect(vcardPayload).toContainText("BEGIN:VCARD");
  await expect(vcardPayload).toContainText("FN:Ada Lovelace");
  await expect(vcardPayload).toContainText("ORG:Analytical Engine Lab");
});

test("二维码工具支持 PNG、SVG 下载和尺寸控制", async ({ page }) => {
  await openQrTool(page);

  await page.getByLabel("尺寸").selectOption("512");
  await expect(page.locator(".qr-output img")).toHaveAttribute("width", "512");

  const pngDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载 PNG" }).click();
  expect((await pngDownload).suggestedFilename()).toBe("qr-code.png");

  const svgDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载 SVG" }).click();
  expect((await svgDownload).suggestedFilename()).toBe("qr-code.svg");
});

test("二维码工具可以在浏览器本地解析二维码图片", async ({ page }) => {
  await openQrTool(page);
  const dataUrl = await QRCode.toDataURL("https://scan.example.com/path", {
    width: 240,
    margin: 2,
  });
  await page.getByLabel("选择包含二维码的图片").setInputFiles({
    name: "scan.png",
    mimeType: "image/png",
    buffer: Buffer.from(dataUrl.split(",")[1], "base64"),
  });
  await expect(page.locator(".qr-scan-result code")).toHaveText(
    "https://scan.example.com/path",
  );

  await page.getByLabel("选择包含二维码的图片").setInputFiles({
    name: "empty.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.locator(".error-banner[role='alert']")).toContainText(
    "此图片中未找到二维码",
  );
});

test("Sprint 20 二维码工具支持深色模式", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("devtoolbox:theme", "dark"),
  );
  await openQrTool(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".qr-mode-tabs")).toBeVisible();
  await expect(page.locator(".qr-scanner-panel")).toBeVisible();
});

test("Sprint 20 二维码工具在移动端无页面级横向溢出", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "移动端专属检查");
  await openQrTool(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});
