import { describe, expect, it } from "vitest";
import {
  generateFakeJson,
  generateLorem,
  generateMockCsv,
  generatePassword,
  generateRandomColors,
  generateRandomDates,
  generateRandomNumbers,
  generateRandomString,
  generateUsernames,
  secureRandomInteger,
} from "./random-generators";

describe("secure strings and identity generators", () => {
  it("generates bounded integers and rejects oversized ranges", () => {
    const values = Array.from({ length: 100 }, () =>
      secureRandomInteger(-5, 5),
    );
    expect(values.every((value) => value >= -5 && value <= 5)).toBe(true);
    expect(() => secureRandomInteger(10, 1)).toThrow(
      "Minimum cannot exceed maximum",
    );
    expect(() => secureRandomInteger(0, 0x1_0000_0000)).toThrow("2^32");
  });

  it("creates random strings and passwords from selected character sets", () => {
    const value = generateRandomString({
      length: 64,
      uppercase: false,
      lowercase: true,
      digits: true,
      symbols: false,
      excludeAmbiguous: true,
    });
    expect(value).toHaveLength(64);
    expect(value).toMatch(/^[a-z2-9]+$/);
    expect(value).not.toMatch(/[lo]/);

    const password = generatePassword({
      length: 32,
      uppercase: true,
      lowercase: true,
      digits: true,
      symbols: true,
      excludeAmbiguous: false,
    });
    expect(password.value).toHaveLength(32);
    expect(password.value).toMatch(/[A-Z]/);
    expect(password.value).toMatch(/[a-z]/);
    expect(password.value).toMatch(/[0-9]/);
    expect(password.value).toMatch(/[^A-Za-z0-9]/);
    expect(password.entropyBits).toBeGreaterThan(180);
  });

  it("creates unique readable usernames within each batch", () => {
    const values = generateUsernames({
      count: 50,
      separator: "_",
      includeDigits: true,
    });
    expect(new Set(values).size).toBe(50);
    expect(values.every((value) => /^[a-z]+_[a-z]+\d{2}$/.test(value))).toBe(
      true,
    );

    const withoutDigits = generateUsernames({
      count: 100,
      separator: "-",
      includeDigits: false,
    });
    expect(new Set(withoutDigits).size).toBe(100);
    expect(withoutDigits.every((value) => /^[a-z]+-[a-z]+$/.test(value))).toBe(
      true,
    );
  });
});

describe("placeholder and fixture generators", () => {
  it("generates bounded Lorem words, sentences, and paragraphs", () => {
    expect(generateLorem("words", 10).split(" ")).toHaveLength(10);
    expect(generateLorem("sentences", 3).match(/\./g)).toHaveLength(3);
    expect(generateLorem("paragraphs", 2).split("\n\n")).toHaveLength(2);
    expect(() => generateLorem("paragraphs", 21)).toThrow("1 to 20");
  });

  it("generates structured fake JSON and RFC-compatible CSV rows", () => {
    const records = JSON.parse(generateFakeJson(3)) as Array<
      Record<string, unknown>
    >;
    expect(records).toHaveLength(3);
    expect(records[0]).toMatchObject({
      active: expect.any(Boolean),
      score: expect.any(Number),
    });
    expect(records[0]?.email).toMatch(/@example\.(com|net)|@sample\.dev/);

    const csv = generateMockCsv(3).split("\n");
    expect(csv).toHaveLength(4);
    expect(csv[0]).toBe("id,name,email,role,country,active");
    expect(csv[1]?.split(",")).toHaveLength(6);
  });
});

describe("number, date, and color generators", () => {
  it("supports unique integers and repeated values when uniqueness is disabled", () => {
    const unique = generateRandomNumbers({
      minimum: 10,
      maximum: 30,
      count: 20,
      integer: true,
      decimals: 0,
      unique: true,
    });
    expect(new Set(unique).size).toBe(20);
    expect(
      unique.every((value) => Number(value) >= 10 && Number(value) <= 30),
    ).toBe(true);
    expect(
      generateRandomNumbers({
        minimum: 5,
        maximum: 5,
        count: 3,
        integer: true,
        decimals: 0,
        unique: false,
      }),
    ).toEqual(["5", "5", "5"]);
    expect(() =>
      generateRandomNumbers({
        minimum: 1,
        maximum: 2,
        count: 3,
        integer: true,
        decimals: 0,
        unique: true,
      }),
    ).toThrow("range is too small");
  });

  it("generates sorted dates inside the selected range", () => {
    const dates = generateRandomDates({
      start: "2024-01-01",
      end: "2024-01-31",
      count: 20,
      format: "date",
    });
    expect(dates).toEqual([...dates].sort());
    expect(
      dates.every((value) => value >= "2024-01-01" && value <= "2024-01-31"),
    ).toBe(true);

    expect(
      generateRandomDates({
        start: "2024-02-29",
        end: "2024-02-29",
        count: 5,
        format: "date",
      }),
    ).toEqual(Array(5).fill("2024-02-29"));
    expect(() =>
      generateRandomDates({
        start: "2024-02-30",
        end: "2024-03-01",
        count: 1,
        format: "iso",
      }),
    ).toThrow("valid start and end dates");
  });

  it("generates valid HEX, RGB, and HSL color values", () => {
    const colors = generateRandomColors(20);
    expect(colors).toHaveLength(20);
    expect(colors.every((color) => /^#[0-9A-F]{6}$/.test(color.hex))).toBe(
      true,
    );
    expect(
      colors.every((color) => /^rgb\(\d+ \d+ \d+\)$/.test(color.rgb)),
    ).toBe(true);
    expect(
      colors.every((color) => /^hsl\(\d+ \d+% \d+%\)$/.test(color.hsl)),
    ).toBe(true);
  });
});
