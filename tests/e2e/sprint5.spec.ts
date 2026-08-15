import { expect, test } from "@playwright/test";
import { strToU8, zipSync } from "fflate";

async function openTool(
  page: import("@playwright/test").Page,
  slug: string,
) {
  await page.goto(`/zh/tools/${slug}`);
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
}

async function expectNoHorizontalOverflow(
  page: import("@playwright/test").Page,
) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
}

test("归档工具安全解包 ZIP 并下载单个文件", async ({ page }) => {
  await openTool(page, "archive-workbench");
  const archive = zipSync({ "docs/hello.txt": strToU8("hello from zip") });
  await page.getByLabel("选择要解包的归档文件").setInputFiles({
    name: "sample.zip",
    mimeType: "application/zip",
    buffer: Buffer.from(archive),
  });
  await expect(page.getByText("docs/hello.txt")).toBeVisible();
  await expect(page.getByText("已安全解包 1 个文件")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载 docs/hello.txt" }).click();
  expect((await download).suggestedFilename()).toBe("hello.txt");
  await expectNoHorizontalOverflow(page);
});

test("文件检查器显示签名、SHA-256 和 Hex", async ({ page }) => {
  await openTool(page, "file-inspector");
  await page.getByLabel("选择要分析的文件").setInputFiles({
    name: "sample.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("abc", "utf8"),
  });
  await expect(page.getByText("text/plain", { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.locator(".hex-viewer")).toContainText("61 62 63");
  await expectNoHorizontalOverflow(page);
});

test("图片工作台在 Canvas 中转换 PNG", async ({ page }) => {
  await openTool(page, "image-workbench");
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR4nGP4z8DAwMDAxAADCBYAOgYCAZ5uN6sAAAAASUVORK5CYII=",
    "base64",
  );
  await page.getByLabel("选择要处理的图片").setInputFiles({
    name: "pixel.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page.getByAltText("原图预览")).toBeVisible();
  await page.getByLabel("输出格式").selectOption("image/png");
  await page.getByRole("button", { name: "处理图片", exact: true }).click();
  await expect(page.getByAltText("处理结果预览")).toBeVisible();
  await expect(page.getByRole("button", { name: "下载图片" })).toBeEnabled();
  await expect(page.getByText("平均颜色", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("SSH 工具只在浏览器生成 OpenSSH Ed25519 密钥", async ({ page }) => {
  await openTool(page, "ssh-key-generator");
  await expect(page.getByText("私钥只在当前浏览器中生成")).toBeVisible();
  await page.getByRole("button", { name: "生成新密钥" }).click();
  await expect(page.getByLabel("OpenSSH 公钥")).toHaveValue(/^ssh-ed25519 /);
  await expect(page.getByLabel("私钥", { exact: true })).toHaveValue(
    /BEGIN OPENSSH PRIVATE KEY/,
  );
  await expect(page.getByText("私钥格式: OpenSSH")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("MIME 与 HTTP 查询支持实时过滤", async ({ page }) => {
  await openTool(page, "mime-type-lookup");
  await page.getByLabel("搜索 MIME Type").fill(".wasm");
  await expect(page.getByText("application/wasm", { exact: true })).toBeVisible();
  await openTool(page, "http-status-reference");
  await page.getByLabel("搜索 HTTP 状态码").fill("not found");
  await expect(page.getByText("404", { exact: true })).toBeVisible();
  await expect(page.getByText("Not Found", { exact: true })).toBeVisible();
  await page.getByLabel("搜索 HTTP 状态码").fill("");
  await page.getByRole("button", { name: "5xx" }).click();
  await expect(page.getByText("500", { exact: true })).toBeVisible();
  await expect(page.getByText("404", { exact: true })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});
