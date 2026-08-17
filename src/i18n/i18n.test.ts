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
    expect(
      localizeToolError(
        "Regex replacements are limited to 10000 characters.",
        messages,
      ),
    ).toBe("正则替换表达式最多允许 10000 个字符。");
    expect(
      localizeToolError(
        "Regex replacements are limited to 1000 matches.",
        messages,
      ),
    ).toBe("正则替换最多允许匹配 1000 次。");
    expect(localizeToolError("Original JSON is required.", messages)).toBe(
      "请输入原始 JSON 后继续。",
    );
    expect(
      localizeToolError(
        "Changed JSON is invalid: Expected property name",
        messages,
      ),
    ).toBe("修改后的 JSON 无效：Expected property name");
    expect(
      localizeToolError(
        "cURL requests are limited to 100 entries per section.",
        messages,
      ),
    ).toBe("cURL 每个配置分区最多允许 100 项。");
    expect(
      localizeToolError("The --header option requires a value.", messages),
    ).toBe("选项 --header 必须提供一个值。");
    expect(
      localizeToolError(
        "cURL field values cannot contain line breaks.",
        messages,
      ),
    ).toBe("cURL 字段值不能包含换行符。");
  });
});
