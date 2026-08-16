import { expect, test } from "@playwright/test";

const generatorPaths = [
  "random-string-generator",
  "password-generator",
  "username-generator",
  "lorem-ipsum-generator",
  "fake-json-generator",
  "mock-data-generator",
  "random-number-generator",
  "random-date-generator",
  "random-color-generator",
] as const;

async function hydrated(page: import("@playwright/test").Page) {
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
}

async function openGenerator(
  page: import("@playwright/test").Page,
  slug: (typeof generatorPaths)[number],
  locale: "en" | "zh" = "zh",
) {
  await page.goto(`/${locale}/tools/${slug}`);
  await hydrated(page);
}

async function generate(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "生成", exact: true }).click();
}

async function outputLines(page: import("@playwright/test").Page) {
  const value = (await page.locator(".generator-output").textContent()) ?? "";
  return value.trim().split("\n").filter(Boolean);
}

test("密码、随机字符串与用户名使用本地安全随机核心", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "完整安全生成流程由桌面项目覆盖",
  );
  await openGenerator(page, "password-generator");
  await page.getByLabel("长度").fill("32");
  await generate(page);
  const password =
    (await page.locator(".generator-output").textContent()) ?? "";
  expect(password).toHaveLength(32);
  expect(password).toMatch(/[A-Z]/);
  expect(password).toMatch(/[a-z]/);
  expect(password).toMatch(/[0-9]/);
  expect(password).toMatch(/[^A-Za-z0-9]/);
  await expect(page.locator(".panel-label")).toContainText("bits");

  await openGenerator(page, "random-string-generator");
  await expect(page.locator(".generator-output")).toBeEmpty();
  await page.getByLabel("长度").fill("48");
  await page.getByLabel("大写").uncheck();
  await page.getByLabel("符号").uncheck();
  await generate(page);
  await expect(page.locator(".generator-output")).toHaveText(/^[a-z2-9]{48}$/);

  await openGenerator(page, "username-generator");
  await page.getByLabel("数量").fill("20");
  await page.getByLabel("分隔符").selectOption("_");
  await generate(page);
  const usernames = await outputLines(page);
  expect(usernames).toHaveLength(20);
  expect(new Set(usernames).size).toBe(20);
  expect(usernames.every((value) => /^[a-z]+_[a-z]+\d{2}$/.test(value))).toBe(
    true,
  );
});

test("Fake JSON、Mock CSV 与 Lorem 输出结构完整", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "完整数据生成流程由桌面项目覆盖",
  );
  await openGenerator(page, "fake-json-generator");
  await page.getByLabel("数量").fill("100");
  await generate(page);
  const json = JSON.parse(
    (await page.locator(".generator-output").textContent()) ?? "[]",
  );
  expect(json).toHaveLength(100);
  expect(json[0]).toMatchObject({
    id: expect.any(String),
    email: expect.stringContaining("@"),
  });
  await expect(page.locator(".generator-output")).toHaveCSS(
    "overflow-y",
    "auto",
  );
  expect(
    await page
      .locator(".generator-output")
      .evaluate((element) => element.scrollHeight > element.clientHeight),
  ).toBe(true);

  await openGenerator(page, "mock-data-generator");
  await page.getByLabel("数量").fill("4");
  await generate(page);
  const csv = await outputLines(page);
  expect(csv).toHaveLength(5);
  expect(csv[0]).toBe("id,name,email,role,country,active");

  await openGenerator(page, "lorem-ipsum-generator");
  await page.getByLabel("模式", { exact: true }).selectOption("sentences");
  await page.getByLabel("数量").fill("4");
  await generate(page);
  const lorem = (await page.locator(".generator-output").textContent()) ?? "";
  expect(lorem.match(/\./g)).toHaveLength(4);
});

test("随机数字、日期与颜色支持边界和可视输出", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "完整数字与视觉生成流程由桌面项目覆盖",
  );
  await openGenerator(page, "random-number-generator");
  await page.getByLabel("最小值").fill("1");
  await page.getByLabel("最大值").fill("3");
  await page.getByLabel("数量").fill("3");
  await page.getByLabel("不重复").check();
  await generate(page);
  const numbers = await outputLines(page);
  expect(new Set(numbers)).toEqual(new Set(["1", "2", "3"]));

  await openGenerator(page, "random-date-generator");
  await page.getByLabel("开始日期").fill("2025-01-15");
  await page.getByLabel("结束日期").fill("2025-01-15");
  await page.getByLabel("数量").fill("3");
  await page.getByLabel("日期格式").selectOption("date");
  await generate(page);
  expect(await outputLines(page)).toEqual([
    "2025-01-15",
    "2025-01-15",
    "2025-01-15",
  ]);

  await openGenerator(page, "random-color-generator");
  await page.getByLabel("数量").fill("6");
  await generate(page);
  await expect(page.locator(".random-color-row")).toHaveCount(6);
  await page.getByLabel("颜色格式").selectOption("hsl");
  await expect(page.locator(".random-color-row code").first()).toHaveText(
    /^hsl\(/,
  );

  await openGenerator(page, "password-generator", "en");
  await expect(
    page.getByRole("heading", {
      name: "Secure Password Generator",
      exact: true,
    }),
  ).toBeVisible();
});

test("Sprint 11 九个工具在移动端生成后无横向溢出", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "移动端专属检查");
  for (const slug of generatorPaths) {
    await openGenerator(page, slug);
    await generate(page);
    await expect(page.locator(".generator-workbench")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
  }
});
