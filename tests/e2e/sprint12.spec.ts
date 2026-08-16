import { expect, test } from "@playwright/test";

const newReferences = [
  {
    slug: "vim-cheatsheet",
    heading: "Vim 命令速查",
    label: "搜索 Vim 命令",
    query: "逐项确认",
    expected: ":%s/old/new/gc",
  },
  {
    slug: "regex-cheatsheet",
    heading: "正则表达式速查",
    label: "搜索 Regex 模式",
    query: "单词边界",
    expected: "\\bword\\b",
  },
  {
    slug: "bash-cheatsheet",
    heading: "Bash 脚本速查",
    label: "搜索 Bash 命令",
    query: "pipefail",
    expected: "set -euo pipefail",
  },
  {
    slug: "sql-cheatsheet",
    heading: "SQL 语句速查",
    label: "搜索 SQL 语句",
    query: "执行计划",
    expected: "EXPLAIN SELECT",
  },
  {
    slug: "javascript-cheatsheet",
    heading: "JavaScript 语法速查",
    label: "搜索 JavaScript 代码",
    query: "异步",
    expected: "Promise.all",
  },
  {
    slug: "python-cheatsheet",
    heading: "Python 语法速查",
    label: "搜索 Python 代码",
    query: "虚拟环境",
    expected: "python -m venv",
  },
  {
    slug: "http-status-code-cheatsheet",
    heading: "HTTP 状态码速查",
    label: "搜索 HTTP 状态码",
    query: "速率限制",
    expected: "429 Too Many Requests",
  },
  {
    slug: "css-cheatsheet",
    heading: "CSS 样式速查",
    label: "搜索 CSS 片段",
    query: "响应式网格",
    expected: "auto-fit",
  },
] as const;

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

test("八个新增速查页支持双语内容搜索", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "完整速查搜索流程由桌面项目覆盖",
  );

  for (const reference of newReferences) {
    await page.goto(`/zh/tools/${reference.slug}`);
    await hydrated(page);
    await expect(
      page.getByRole("heading", { name: reference.heading, exact: true }),
    ).toBeVisible();
    await page
      .getByLabel(reference.label, { exact: true })
      .fill(reference.query);
    await expect(page.locator(".cheatsheet-row")).toHaveCount(1);
    await expect(page.locator(".cheatsheet-row code")).toContainText(
      reference.expected,
    );
  }

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:3479",
  });
  const copyButton = page.locator(".cheatsheet-row button");
  await copyButton.click();
  await expect(copyButton).toContainText("已复制");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "grid-template-columns",
  );

  await page.goto("/en/tools/http-status-code-cheatsheet");
  await hydrated(page);
  await page
    .getByLabel("Search HTTP status codes", { exact: true })
    .fill("404");
  await expect(page.locator(".cheatsheet-row code")).toHaveText(
    "404 Not Found",
  );
});

test("速查搜索提供明确空状态并在跨页导航时重置", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "完整状态流程由桌面项目覆盖");

  await page.goto("/zh/tools/regex-cheatsheet");
  await hydrated(page);
  await page
    .getByLabel("搜索 Regex 模式", { exact: true })
    .fill("不会匹配的内容");
  await expect(page.getByText("没有匹配的条目", { exact: true })).toBeVisible();

  await page.goto("/zh/tools/css-cheatsheet");
  await hydrated(page);
  await expect(page.getByLabel("搜索 CSS 片段", { exact: true })).toHaveValue(
    "",
  );
  await expect(page.locator(".cheatsheet-row")).toHaveCount(8);
});

test("Sprint 12 八个速查页在移动端无横向溢出", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "移动端专属检查");

  for (const reference of newReferences) {
    await page.goto(`/zh/tools/${reference.slug}`);
    await hydrated(page);
    await expect(page.locator(".cheatsheet-workbench")).toBeVisible();
    await expectNoOverflow(page);
    expect(
      await page
        .locator(".cheatsheet-row code")
        .evaluateAll((elements) =>
          elements.every(
            (element) => element.scrollWidth <= element.clientWidth + 1,
          ),
        ),
    ).toBe(true);
  }
});
