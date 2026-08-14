import { describe, expect, it } from "vitest";
import {
  getMessages,
  isLocale,
  localeFromAcceptLanguage,
  localePath,
  switchLocalePath,
} from "./index";
import { hasChineseToolTranslation } from "./tool-metadata";
import {
  categories,
  getCategories,
  getTool,
  getTools,
  searchTools,
  tools,
} from "@/lib/tool-registry";

describe("localization", () => {
  it("validates and constructs locale-prefixed routes", () => {
    expect(isLocale("zh")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(localePath("zh", "/tools/json-formatter")).toBe(
      "/zh/tools/json-formatter",
    );
    expect(switchLocalePath("/zh/tools/base64", "en")).toBe("/en/tools/base64");
  });
  it("detects Chinese and English browser preferences", () => {
    expect(localeFromAcceptLanguage("zh-CN,zh;q=0.9,en;q=0.8")).toBe("zh");
    expect(localeFromAcceptLanguage("en-US,en;q=0.9")).toBe("en");
  });
  it("has complete Chinese metadata for every tool and category", () => {
    expect(tools.every((tool) => hasChineseToolTranslation(tool.id))).toBe(
      true,
    );
    expect(getTools("zh")).toHaveLength(tools.length);
    expect(getCategories("zh")).toHaveLength(categories.length);
    expect(getTool("json-formatter", "zh")?.name).toBe("JSON 格式化");
    expect(getMessages("zh").nav.allTools).toBe("全部工具");
  });
  it("searches both languages while presenting the selected locale", () => {
    expect(searchTools("格式化", "zh")[0].name).toContain("JSON");
    expect(searchTools("formatter", "zh")[0].name).toBe("JSON 格式化");
    expect(
      searchTools("二维码", "en").some(
        (tool) => tool.slug === "qr-code-generator",
      ),
    ).toBe(true);
  });
});
