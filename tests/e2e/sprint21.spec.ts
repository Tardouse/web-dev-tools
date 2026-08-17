import { expect, test, type Page } from "@playwright/test";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

async function waitForHydration(page: Page) {
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
}

test("工具分享链接和收藏在中英文页面之间保持一致", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/zh/tools/color-converter");
  await waitForHydration(page);
  await page.getByRole("button", { name: "分享颜色转换" }).click();
  await expect(page.getByText("工具链接已复制", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "/zh/tools/color-converter",
  );
  await page.getByRole("button", { name: "收藏颜色转换" }).click();

  await page.goto("/en/favorites");
  await waitForHydration(page);
  await expect(page.getByRole("heading", { name: "Favorites" })).toBeVisible();
  await expect(
    page.locator(".tool-card").filter({ hasText: "Color Converter" }),
  ).toHaveCount(2);
});

test("颜色工具支持本地 JSON 导入和 JSON 导出", async ({ page }) => {
  await page.goto("/zh/tools/color-converter");
  await waitForHydration(page);
  await page.getByLabel("导入颜色文件").setInputFiles({
    name: "color.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ hex: "#12abef" })),
  });
  await expect(page.locator("#color-input")).toHaveValue("#12abef");
  await expect(page.locator(".color-source-preview strong")).toHaveText(
    "#12ABEF",
  );

  await page.getByRole("tab", { name: "CSS 生成器" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载 JSON" }).click();
  expect((await download).suggestedFilename()).toBe("color-analysis.json");
});

test("二维码 payload 可下载且状态区域可访问", async ({ page }) => {
  await page.goto("/en/tools/qr-code-generator");
  await waitForHydration(page);
  await page.getByText("Encoded payload", { exact: true }).click();
  await expect(page.locator(".qr-payload-output")).toHaveAttribute(
    "aria-live",
    "polite",
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).last().click();
  expect((await download).suggestedFilename()).toBe("qr-payload.txt");
});

test("长颜色输入显示统一错误并在移动端保持无溢出", async ({
  page,
}, testInfo) => {
  await page.goto("/zh/tools/color-converter");
  await waitForHydration(page);
  await page.locator("#color-input").fill("x".repeat(1_048_577));
  await expect(page.locator(".error-banner[role='alert']")).toContainText(
    "输入大小",
  );
  if (testInfo.project.name === "mobile") {
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
  }
});
