import { describe, expect, it } from "vitest";
import {
  cleanLines,
  convertDataSize,
  deduplicateText,
  mergeText,
  sortLines,
  splitText,
  transformLineNumbers,
} from "./text-processing";

describe("data size conversion", () => {
  it("converts bits, bytes, SI units, and IEC units from one source value", () => {
    expect(convertDataSize("8", "bit")).toMatchObject({
      bits: 8,
      bytes: 1,
      values: { B: 1, KB: 0.001, KiB: 1 / 1024 },
    });
    const gibibyte = convertDataSize("1", "GiB");
    expect(gibibyte.values.MiB).toBe(1024);
    expect(gibibyte.values.GB).toBeCloseTo(1.073741824);
  });

  it("rejects negative, malformed, and overflowing sizes", () => {
    expect(() => convertDataSize("-1", "B")).toThrow("non-negative");
    expect(() => convertDataSize("1 MB", "B")).toThrow("non-negative");
    expect(() => convertDataSize("1e308", "TiB")).toThrow("too large");
  });
});

describe("line transformations", () => {
  it("removes blank and duplicate lines with configurable normalization", () => {
    expect(
      cleanLines(" Alpha \r\n\r\nalpha\r\nBeta\n  ", {
        removeBlank: true,
        removeDuplicates: true,
        trimLines: true,
        caseSensitive: false,
      }),
    ).toBe("Alpha\nBeta");
  });

  it("sorts naturally, by length, and reverses line order", () => {
    const base = {
      descending: false,
      caseSensitive: true,
      locale: "en-US" as const,
    };
    expect(
      sortLines("item10\nitem2\nitem1", { ...base, mode: "natural" }),
    ).toBe("item1\nitem2\nitem10");
    expect(sortLines("three\na\nfour", { ...base, mode: "length" })).toBe(
      "a\nfour\nthree",
    );
    expect(sortLines("one\ntwo\nthree", { ...base, mode: "reverse" })).toBe(
      "three\ntwo\none",
    );
  });

  it("adds padded line numbers and removes common number prefixes", () => {
    const numbered = transformLineNumbers("alpha\nbeta\ngamma", {
      action: "add",
      start: 8,
      pad: true,
      separator: "dot",
    });
    expect(numbered).toBe("08. alpha\n09. beta\n10. gamma");
    expect(
      transformLineNumbers("01. alpha\n2: beta\n3\tgamma\nplain", {
        action: "remove",
        start: 1,
        pad: false,
        separator: "dot",
      }),
    ).toBe("alpha\nbeta\ngamma\nplain");
  });
});

describe("general text transformations", () => {
  it("deduplicates lines, words, and Unicode code points", () => {
    expect(
      deduplicateText("Alpha\nalpha\nBeta", {
        mode: "lines",
        caseSensitive: false,
      }),
    ).toBe("Alpha\nBeta");
    expect(
      deduplicateText("one two one THREE three", {
        mode: "words",
        caseSensitive: false,
      }),
    ).toBe("one two THREE");
    expect(
      deduplicateText("A🚀A🚀B", {
        mode: "characters",
        caseSensitive: true,
      }),
    ).toBe("A🚀B");
  });

  it("appends and interleaves two texts", () => {
    expect(
      mergeText("alpha", "beta", { mode: "append", separator: "\n\n" }),
    ).toBe("alpha\n\nbeta");
    expect(
      mergeText("A1\nA2", "B1\nB2\nB3", {
        mode: "interleave",
        separator: "\n",
      }),
    ).toBe("A1\nB1\nA2\nB2\nB3");
  });

  it("splits on built-in or literal delimiters with text and JSON output", () => {
    expect(
      splitText(" alpha, beta,,gamma ", {
        mode: "comma",
        delimiter: "",
        trimParts: true,
        removeEmpty: true,
        output: "lines",
      }),
    ).toBe("alpha\nbeta\ngamma");
    expect(
      splitText("one::two::three", {
        mode: "custom",
        delimiter: "::",
        trimParts: false,
        removeEmpty: false,
        output: "json",
      }),
    ).toBe('[\n  "one",\n  "two",\n  "three"\n]');
    expect(() =>
      splitText("value", {
        mode: "custom",
        delimiter: "",
        trimParts: true,
        removeEmpty: true,
        output: "lines",
      }),
    ).toThrow("custom delimiter");
  });
});
