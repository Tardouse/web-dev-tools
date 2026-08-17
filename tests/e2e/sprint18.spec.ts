import { expect, test, type Page } from "@playwright/test";

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

function parsedRow(page: Page, label: string) {
  return page
    .locator(".parse-key", { hasText: label })
    .locator("xpath=following-sibling::*[1]");
}

test("cURL 解析器提取请求完整结构并本地化错误", async ({ page }) => {
  await installWorkerProbe(page);
  await openTool(page, "curl-parser");

  await page
    .getByLabel("cURL 命令")
    .fill(
      "curl -X PATCH 'https://example.com/items?tag=one&tag=two' " +
        "-H 'Accept: application/json' -H 'Authorization: Basic YWRhOnMzY3JldA==' " +
        "-b 'theme=dark; session=abc' --data-raw '{\"name\":\"测试\"}'",
    );

  await expect(parsedRow(page, "方法")).toHaveText("PATCH");
  await expect(parsedRow(page, "URL")).toHaveText("https://example.com/items");
  await expect(parsedRow(page, "请求头")).toContainText("Accept");
  await expect(parsedRow(page, "查询参数")).toContainText("tag");
  await expect(parsedRow(page, "查询参数")).toContainText("two");
  await expect(parsedRow(page, "Cookie")).toContainText("session");
  await expect(parsedRow(page, "身份认证")).toContainText("ada:s3cret");
  await expect(parsedRow(page, "请求体")).toContainText('"name":"测试"');
  await expectWorker(page, "curl-parse");

  await page
    .getByLabel("cURL 命令")
    .fill("curl https://example.com -H invalid-header");
  await expect(page.locator(".error-banner[role='alert']")).toContainText(
    "请求头必须使用“名称: 值”格式",
  );
});

test("cURL 解析器识别 URL 编码和 Multipart 请求体", async ({ page }) => {
  await openTool(page, "curl-parser");
  await page
    .getByLabel("cURL 命令")
    .fill(
      "curl https://example.com/search --data-urlencode 'q=dev tools' -d 'page=2'",
    );
  await expect(parsedRow(page, "请求体")).toContainText("URL 编码表单");
  await expect(parsedRow(page, "请求体")).toContainText("dev tools");

  await page
    .getByLabel("cURL 命令")
    .fill(
      "curl https://example.com/upload -F 'title=报告' -F 'document=@./report.pdf;type=application/pdf'",
    );
  await expect(parsedRow(page, "请求体")).toContainText("Multipart 表单");
  await expect(parsedRow(page, "请求体")).toContainText("report.pdf");
  await expect(parsedRow(page, "请求体")).toContainText("application/pdf");
});

test("cURL 生成器编辑请求分区并生成全部目标格式", async ({ page }) => {
  await installWorkerProbe(page);
  await openTool(page, "curl-generator");

  await page.getByRole("tab", { name: "查询参数" }).click();
  await page.getByRole("button", { name: "添加查询参数" }).click();
  await page.getByLabel("名称 2").fill("tag");
  await page.getByLabel("值 2").fill("two words");

  await page.getByRole("tab", { name: "Cookie" }).click();
  await page.getByRole("button", { name: "添加 Cookie" }).click();
  await page.getByLabel("名称 1").fill("session");
  await page.getByLabel("值 1").fill("abc");

  await page.getByRole("tab", { name: "身份认证" }).click();
  await page.getByRole("button", { name: "Basic Auth" }).click();
  await page.getByLabel("用户名").fill("ada");
  await page.getByLabel("密码").fill("s3cret");

  await page.getByRole("tab", { name: "请求体" }).click();
  const output = page.getByLabel("cURL 输出");
  await page.getByRole("button", { name: "无", exact: true }).click();
  await expect(output).not.toContainText("--data");
  await page.getByRole("button", { name: "URL 编码表单" }).click();
  await page.getByRole("button", { name: "添加字段" }).click();
  await page.getByLabel("名称 1").fill("title");
  await page.getByLabel("值 1").fill("测试报告");

  await expect(output).toContainText("--data-urlencode");
  await expect(output).toContainText("tag=two+words");
  await expect(output).toContainText("session=abc");
  await expect(output).toContainText("ada:s3cret");
  await expectWorker(page, "curl-generate");

  await page.getByRole("button", { name: "Multipart 表单" }).click();
  await page.getByLabel("类型 1").selectOption("file");
  await page.getByLabel("名称 1").fill("document");
  await page.getByLabel("文件路径 1").fill("./report.pdf");
  await page.getByLabel("内容类型 1").fill("application/pdf");
  await expect(output).toContainText("document=@./report.pdf");
  await expect(output).not.toContainText("Content-Type: application/json");

  const formats: Array<[string, string]> = [
    ["curl", "curl --request"],
    ["fetch", "await fetch"],
    ["axios", "await axios"],
    ["python-requests", "requests.request"],
    ["python-httpx", "httpx.request"],
    ["go", "http.NewRequest"],
    ["php", "curl_setopt_array"],
    ["java", "HttpRequest.newBuilder"],
    ["csharp", "HttpRequestMessage"],
    ["xhr", "new XMLHttpRequest"],
  ];
  for (const [format, signature] of formats) {
    await page.getByLabel("输出格式").selectOption(format);
    await expect(page.locator(".curl-code-output")).toContainText(signature);
  }
});

test("cURL 生成器校验 URL 并显示中文错误", async ({ page }) => {
  await openTool(page, "curl-generator");
  await page.getByLabel("URL", { exact: true }).fill("relative/path");
  await expect(page.locator(".error-banner[role='alert']")).toContainText(
    "请求 URL 无效",
  );
});

test("Sprint 18 cURL 工具支持深色模式", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("devtoolbox:theme", "dark"),
  );
  await openTool(page, "curl-generator");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".curl-generator-workspace")).toBeVisible();
  await expect(page.locator(".curl-section-tabs")).toBeVisible();
  await expect(page.locator(".curl-code-output")).not.toBeEmpty();
});

test("Sprint 18 cURL 工具在移动端无页面级横向溢出", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "移动端专属检查");
  for (const slug of ["curl-parser", "curl-generator"]) {
    await openTool(page, slug);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      `${slug} should not overflow the mobile viewport`,
    ).toBe(true);
  }
});
