import { describe, expect, it } from "vitest";
import { convertBase, parseColor } from "./number-color";

describe("number and color tools", () => {
  it("converts arbitrary precision integers", () => {
    expect(convertBase("255", 10, 16)).toBe("ff");
    expect(convertBase("11111111", 2, 10)).toBe("255");
    expect(convertBase("900719925474099312345", 10, 36)).toBe(
      BigInt("900719925474099312345").toString(36),
    );
  });
  it("rejects digits outside the source base", () =>
    expect(() => convertBase("2", 2, 10)).toThrow("valid base-2"));
  it("converts HEX to RGB and all derived color models", () =>
    expect(parseColor("#2563eb")).toMatchObject({
      hex: "#2563EB",
      rgb: { r: 37, g: 99, b: 235 },
      hsl: { h: 221, s: 83, l: 53 },
      hsv: { h: 221, s: 84, v: 92 },
      cmyk: { c: 84, m: 58, y: 0, k: 8 },
      complementary: { hex: "#EBAC24" },
      contrast: { preferred: "#FFFFFF", blackRatio: 4.06, whiteRatio: 5.17 },
    }));
  it("accepts RGB triplets", () =>
    expect(parseColor("255, 0, 128").hex).toBe("#FF0080"));
  it("rejects out-of-range RGB", () =>
    expect(() => parseColor("300, 0, 0")).toThrow("between 0 and 255"));
  it("accepts HSL, HSV, and CMYK functional values", () => {
    expect(parseColor("hsl(0, 100%, 50%)").hex).toBe("#FF0000");
    expect(parseColor("hsv(120, 100%, 100%)").hex).toBe("#00FF00");
    expect(parseColor("cmyk(100%, 0%, 0%, 0%)").hex).toBe("#00FFFF");
    expect(parseColor("rgb(100% 0% 50%)").hex).toBe("#FF0080");
  });
  it("creates a readable palette and CSS custom properties", () => {
    const value = parseColor("#2563EB");
    expect(value.palette).toHaveLength(10);
    expect(value.palette.map((entry) => entry.step)).toEqual([
      50, 100, 200, 300, 400, 500, 600, 700, 800, 900,
    ]);
    expect(new Set(value.palette.map((entry) => entry.hex)).size).toBe(10);
    expect(value.css).toContain("--color-primary-contrast: #FFFFFF;");
    expect(value.css).toContain("--color-primary-complement: #EBAC24;");
  });
  it("handles black and rejects invalid hue, percentages, and oversized input", () => {
    expect(parseColor("#000")).toMatchObject({
      hsv: { s: 0, v: 0 },
      cmyk: { c: 0, m: 0, y: 0, k: 100 },
      contrast: { preferred: "#FFFFFF" },
    });
    expect(() => parseColor("hsl(361, 50%, 50%)")).toThrow("between 0 and 360");
    expect(() => parseColor("hsv(10, 101%, 50%)")).toThrow(
      "between 0% and 100%",
    );
    expect(() => parseColor("x".repeat(1_048_577))).toThrow(
      "The limit for this tool",
    );
  });
});
