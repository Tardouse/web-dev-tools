import { describe, expect, it } from "vitest";
import {
  getMessages,
  isLocale,
  localeFromAcceptLanguage,
  localePath,
  switchLocalePath,
} from "./index";
import { hasChineseToolTranslation } from "./tool-metadata";
import { localizeToolError } from "./errors";
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
  it("localizes unified execution limit failures", () => {
    const messages = getMessages("zh");
    expect(
      localizeToolError("Tool execution exceeded the 10 s limit.", messages),
    ).toBe("操作超过 10 s 的执行时间上限。");
    expect(
      localizeToolError(
        "Output is 12.0 MB. The limit for this tool is 10.0 MB.",
        messages,
      ),
    ).toBe("输出大小为 12.0 MB，此工具的上限为 10.0 MB。");
    expect(
      localizeToolError(
        "No more than 2 tool operations can run at once.",
        messages,
      ),
    ).toBe("最多只能同时执行 2 个工具操作。");
    expect(
      localizeToolError(
        "JSON contains characters that XML 1.0 cannot represent.",
        messages,
      ),
    ).toBe("JSON 包含 XML 1.0 无法表示的字符。");
    expect(
      localizeToolError(
        "Unicode input contains an unpaired surrogate.",
        messages,
      ),
    ).toBe("Unicode 输入包含孤立代理项。");
    expect(
      localizeToolError(
        "Enter a custom delimiter before splitting text.",
        messages,
      ),
    ).toBe("请先输入自定义分隔符再拆分文本。");
  });
});
