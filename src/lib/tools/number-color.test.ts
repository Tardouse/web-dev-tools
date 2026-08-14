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
  it("converts HEX to RGB and HSL", () =>
    expect(parseColor("#2563eb")).toEqual({
      hex: "#2563EB",
      rgb: { r: 37, g: 99, b: 235 },
      hsl: { h: 221, s: 83, l: 53 },
    }));
  it("accepts RGB triplets", () =>
    expect(parseColor("255, 0, 128").hex).toBe("#FF0080"));
  it("rejects out-of-range RGB", () =>
    expect(() => parseColor("300, 0, 0")).toThrow("between 0 and 255"));
});
