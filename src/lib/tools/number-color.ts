import { TOOL_LIMITS, assertInputLimit } from "@/lib/config";

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

export function convertBase(
  input: string,
  fromBase: number,
  toBase: number,
): string {
  assertInputLimit(input, TOOL_LIMITS.text);
  if (
    !Number.isInteger(fromBase) ||
    fromBase < 2 ||
    fromBase > 36 ||
    !Number.isInteger(toBase) ||
    toBase < 2 ||
    toBase > 36
  ) {
    throw new Error("Bases must be whole numbers from 2 to 36.");
  }
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return "";
  const negative = trimmed.startsWith("-");
  const absolute = negative ? trimmed.slice(1) : trimmed;
  if (
    !absolute ||
    Array.from(absolute).some(
      (character) =>
        DIGITS.indexOf(character) < 0 || DIGITS.indexOf(character) >= fromBase,
    )
  ) {
    throw new Error(`The input is not a valid base-${fromBase} integer.`);
  }
  let value = 0n;
  for (const character of absolute)
    value = value * BigInt(fromBase) + BigInt(DIGITS.indexOf(character));
  return `${negative ? "-" : ""}${value.toString(toBase)}`;
}

export interface ColorValue {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function parseColor(input: string): ColorValue {
  const value = input.trim();
  let r: number;
  let g: number;
  let b: number;
  const hexMatch = value.match(/^#?([\da-f]{3}|[\da-f]{6})$/i);
  const rgbMatch =
    value.match(
      /^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i,
    ) ?? value.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/);
  if (hexMatch) {
    const raw =
      hexMatch[1].length === 3
        ? Array.from(hexMatch[1])
            .map((part) => part + part)
            .join("")
        : hexMatch[1];
    r = Number.parseInt(raw.slice(0, 2), 16);
    g = Number.parseInt(raw.slice(2, 4), 16);
    b = Number.parseInt(raw.slice(4, 6), 16);
  } else if (rgbMatch) {
    [r, g, b] = rgbMatch.slice(1).map(Number);
    if ([r, g, b].some((channel) => channel > 255))
      throw new Error("RGB channels must be between 0 and 255.");
  } else {
    throw new Error(
      "Enter a HEX color such as #2563eb or an RGB value such as 37, 99, 235.",
    );
  }
  r = clamp(r, 0, 255);
  g = clamp(g, 0, 255);
  b = clamp(b, 0, 255);
  const normalized = [r, g, b].map((channel) => channel / 255);
  const max = Math.max(...normalized);
  const min = Math.min(...normalized);
  const delta = max - min;
  let h = 0;
  if (delta) {
    if (max === normalized[0])
      h = 60 * (((normalized[1] - normalized[2]) / delta) % 6);
    else if (max === normalized[1])
      h = 60 * ((normalized[2] - normalized[0]) / delta + 2);
    else h = 60 * ((normalized[0] - normalized[1]) / delta + 4);
  }
  if (h < 0) h += 360;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return {
    hex: `#${[r, g, b]
      .map((channel) => channel.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()}`,
    rgb: { r, g, b },
    hsl: { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) },
  };
}
