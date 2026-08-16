import { expect, test, type Page } from "@playwright/test";
import { gzipSync, strToU8, unzipSync } from "fflate";
import { packTar } from "modern-tar";

type WorkerProbeWindow = typeof window & { __toolWorkerNames: string[] };

async function installWorkerProbe(page: Page) {
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    const names: string[] = [];
    Object.defineProperty(window, "__toolWorkerNames", {
      value: names,
      configurable: true,
    });
    window.Worker = class ToolWorkerProbe extends NativeWorker {
      constructor(scriptURL: string | URL, options?: WorkerOptions) {
        names.push(options?.name ?? String(scriptURL));
        super(scriptURL, options);
      }
    };
  });
}

async function openTool(page: Page, slug: string) {
  await page.goto(`/zh/tools/${slug}`);
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
}

async function expectWorker(page: Page, operation: string) {
  await expect
    .poll(() =>
      page.evaluate(
        (name) =>
          (window as WorkerProbeWindow).__toolWorkerNames.includes(
            `devtoolbox-${name}`,
          ),
        operation,
      ),
    )
    .toBe(true);
}

async function downloadBytes(
  download: import("@playwright/test").Download,
): Promise<Buffer> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

test("文本、文件和 SSH 计算使用可终止的本地 Worker", async ({ page }) => {
  await installWorkerProbe(page);

  await openTool(page, "json-formatter");
  await page.getByLabel("输入").fill('{"worker":true}');
  await page.getByRole("button", { name: "格式化 JSON" }).click();
  await expect(page.locator(".editor-output")).toContainText('"worker": true');
  await expectWorker(page, "json-format");

  await openTool(page, "regex-tester");
  await page.getByLabel("正则表达式").fill("worker-(\\d+)");
  await page.getByLabel("测试文本").fill("worker-13");
  await expect(
    page.getByText("worker-13", { exact: true }).last(),
  ).toBeVisible();
  await expectWorker(page, "regex-test");

  await openTool(page, "text-diff");
  await page.getByLabel("原始文本").fill("before\n");
  await page.getByLabel("修改后文本").fill("after\n");
  await expect(page.locator(".diff-inline-modified").first()).toBeVisible();
  await expectWorker(page, "diff");

  await openTool(page, "file-inspector");
  await page.getByLabel("选择要分析的文件").setInputFiles({
    name: "worker.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("abc"),
  });
  await expect(page.locator(".hash-output code")).toHaveText(
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  await expectWorker(page, "file-hash");

  await openTool(page, "ssh-key-generator");
  await page.getByRole("button", { name: "生成新密钥" }).click();
  await expect(page.getByLabel("OpenSSH 公钥")).toHaveValue(/^ssh-ed25519 /);
  await expectWorker(page, "ssh-key");
});

test("归档 Worker 完成 TAR 解包、ZIP 创建和 GZIP 解压", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "归档二进制流程由桌面项目覆盖");
  await installWorkerProbe(page);
  await openTool(page, "archive-workbench");

  const tar = await packTar([
    { header: { name: "docs/worker.txt", size: 11 }, body: "worker tar!" },
  ]);
  await page.getByLabel("选择要解包的归档文件").setInputFiles({
    name: "worker.tar",
    mimeType: "application/x-tar",
    buffer: Buffer.from(tar),
  });
  await expect(page.getByText("docs/worker.txt")).toBeVisible();
  await expectWorker(page, "archive-extract");

  await page.getByRole("button", { name: "创建 ZIP", exact: true }).click();
  await page.getByLabel("选择要创建 ZIP 的文件").setInputFiles([
    {
      name: "one.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("one"),
    },
    {
      name: "two.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("two"),
    },
  ]);
  const zipDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "创建并下载 ZIP" }).click();
  const zip = await zipDownload;
  expect(zip.suggestedFilename()).toBe("devtoolbox-files.zip");
  const entries = unzipSync(new Uint8Array(await downloadBytes(zip)));
  expect(Buffer.from(entries["one.txt"]).toString()).toBe("one");
  expect(Buffer.from(entries["two.txt"]).toString()).toBe("two");
  await expectWorker(page, "archive-create-zip");

  await page.getByRole("button", { name: "GZIP", exact: true }).click();
  await page.getByRole("button", { name: "解压", exact: true }).click();
  await page.getByLabel("选择 GZIP 文件").setInputFiles({
    name: "message.txt.gz",
    mimeType: "application/gzip",
    buffer: Buffer.from(gzipSync(strToU8("worker gzip"))),
  });
  const gzipDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "解压并下载" }).click();
  const extracted = await gzipDownload;
  expect(extracted.suggestedFilename()).toBe("message.txt");
  expect((await downloadBytes(extracted)).toString()).toBe("worker gzip");
  await expectWorker(page, "archive-gzip");
});
