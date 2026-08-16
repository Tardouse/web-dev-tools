import { describe, expect, it } from "vitest";
import { categories, getTool, searchTools, tools } from "./tool-registry";

describe("tool registry", () => {
  it("registers a complete extensible first release", () => {
    expect(tools).toHaveLength(60);
    expect(new Set(tools.map((tool) => tool.slug)).size).toBe(tools.length);
    expect(
      tools.every(
        (tool) =>
          tool.seoTitle &&
          tool.faq.length &&
          tool.maxInputSize > 0 &&
          tool.maxOutputSize > 0 &&
          tool.maxExecutionTime > 0 &&
          tool.maxConcurrency > 0,
      ),
    ).toBe(true);
  });
  it("references existing categories and related tools", () => {
    const categoryIds = new Set(categories.map((category) => category.id));
    const slugs = new Set(tools.map((tool) => tool.slug));
    expect(tools.every((tool) => categoryIds.has(tool.category))).toBe(true);
    expect(
      tools.every((tool) => tool.related.every((slug) => slugs.has(slug))),
    ).toBe(true);
  });
  it("searches names, keywords, descriptions, and categories", () => {
    expect(searchTools("json")[0].slug).toBe("json-formatter");
    expect(
      searchTools("sha256").some((tool) => tool.slug === "hash-generator"),
    ).toBe(true);
    expect(
      searchTools("web development").some((tool) => tool.category === "web"),
    ).toBe(true);
    expect(getTool("missing")).toBeUndefined();
  });
});
