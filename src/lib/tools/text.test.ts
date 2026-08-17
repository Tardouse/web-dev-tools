import { describe, expect, it } from "vitest";
import { convertCase, countText, formatHtmlFallback } from "./text";

describe("text tools", () => {
  it("counts Unicode and lines", () => {
    expect(countText("Hello 世界 123\nNext")).toMatchObject({
      words: 4,
      lines: 2,
      chineseCharacters: 2,
      englishCharacters: 9,
      numbers: 3,
    });
  });
  it.each([
    ["camel", "helloDeveloperTools"],
    ["pascal", "HelloDeveloperTools"],
    ["snake", "hello_developer_tools"],
    ["kebab", "hello-developer-tools"],
    ["constant", "HELLO_DEVELOPER_TOOLS"],
    ["dot", "hello.developer.tools"],
  ] as const)("converts to %s", (mode, expected) =>
    expect(convertCase("hello Developer-tools", mode)).toBe(expected),
  );
  it("capitalizes the first Unicode letter without changing the remainder", () => {
    expect(convertCase("  hello WORLD", "capitalize")).toBe("  Hello WORLD");
    expect(convertCase("123 élève", "capitalize")).toBe("123 Élève");
    expect(convertCase("123 🚀", "capitalize")).toBe("123 🚀");
  });
  it("formats simple HTML without executing it", () => {
    expect(formatHtmlFallback("<main><p>Hello</p></main>")).toContain("  <p>");
  });
});
