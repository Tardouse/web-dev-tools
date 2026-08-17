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

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

export interface HsvColor {
  h: number;
  s: number;
  v: number;
}

export interface CmykColor {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface ColorPaletteEntry {
  step: number;
  hex: string;
  contrast: "#000000" | "#FFFFFF";
}

export interface ColorValue {
  hex: string;
  rgb: RgbColor;
  hsl: HslColor;
  hsv: HsvColor;
  cmyk: CmykColor;
  complementary: { hex: string; rgb: RgbColor; hsl: HslColor };
  contrast: {
    preferred: "#000000" | "#FFFFFF";
    blackRatio: number;
    whiteRatio: number;
  };
  palette: ColorPaletteEntry[];
  css: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeRgb(rgb: RgbColor): RgbColor {
  return {
    r: Math.round(clamp(rgb.r, 0, 255)),
    g: Math.round(clamp(rgb.g, 0, 255)),
    b: Math.round(clamp(rgb.b, 0, 255)),
  };
}

function rgbToHex({ r, g, b }: RgbColor): string {
  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const normalized = [r, g, b].map((channel) => channel / 255);
  const max = Math.max(...normalized);
  const min = Math.min(...normalized);
  const delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === normalized[0]) {
      hue = 60 * (((normalized[1] - normalized[2]) / delta) % 6);
    } else if (max === normalized[1]) {
      hue = 60 * ((normalized[2] - normalized[0]) / delta + 2);
    } else {
      hue = 60 * ((normalized[0] - normalized[1]) / delta + 4);
    }
  }
  if (hue < 0) hue += 360;
  const lightness = (max + min) / 2;
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return {
    h: Math.round(hue),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

export function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const hue = ((h % 360) + 360) % 360;
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const section = hue / 60;
  const intermediate = chroma * (1 - Math.abs((section % 2) - 1));
  let channels: [number, number, number];
  if (section < 1) channels = [chroma, intermediate, 0];
  else if (section < 2) channels = [intermediate, chroma, 0];
  else if (section < 3) channels = [0, chroma, intermediate];
  else if (section < 4) channels = [0, intermediate, chroma];
  else if (section < 5) channels = [intermediate, 0, chroma];
  else channels = [chroma, 0, intermediate];
  const offset = lightness - chroma / 2;
  return normalizeRgb({
    r: (channels[0] + offset) * 255,
    g: (channels[1] + offset) * 255,
    b: (channels[2] + offset) * 255,
  });
}

export function rgbToHsv({ r, g, b }: RgbColor): HsvColor {
  const normalized = [r, g, b].map((channel) => channel / 255);
  const max = Math.max(...normalized);
  const min = Math.min(...normalized);
  const delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === normalized[0]) {
      hue = 60 * (((normalized[1] - normalized[2]) / delta) % 6);
    } else if (max === normalized[1]) {
      hue = 60 * ((normalized[2] - normalized[0]) / delta + 2);
    } else {
      hue = 60 * ((normalized[0] - normalized[1]) / delta + 4);
    }
  }
  if (hue < 0) hue += 360;
  return {
    h: Math.round(hue),
    s: Math.round((max === 0 ? 0 : delta / max) * 100),
    v: Math.round(max * 100),
  };
}

export function hsvToRgb({ h, s, v }: HsvColor): RgbColor {
  const hue = ((h % 360) + 360) % 360;
  const saturation = s / 100;
  const value = v / 100;
  const chroma = value * saturation;
  const section = hue / 60;
  const intermediate = chroma * (1 - Math.abs((section % 2) - 1));
  let channels: [number, number, number];
  if (section < 1) channels = [chroma, intermediate, 0];
  else if (section < 2) channels = [intermediate, chroma, 0];
  else if (section < 3) channels = [0, chroma, intermediate];
  else if (section < 4) channels = [0, intermediate, chroma];
  else if (section < 5) channels = [intermediate, 0, chroma];
  else channels = [chroma, 0, intermediate];
  const offset = value - chroma;
  return normalizeRgb({
    r: (channels[0] + offset) * 255,
    g: (channels[1] + offset) * 255,
    b: (channels[2] + offset) * 255,
  });
}

export function rgbToCmyk({ r, g, b }: RgbColor): CmykColor {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const black = 1 - Math.max(red, green, blue);
  if (black >= 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - red - black) / (1 - black)) * 100),
    m: Math.round(((1 - green - black) / (1 - black)) * 100),
    y: Math.round(((1 - blue - black) / (1 - black)) * 100),
    k: Math.round(black * 100),
  };
}

export function cmykToRgb({ c, m, y, k }: CmykColor): RgbColor {
  const black = k / 100;
  return normalizeRgb({
    r: 255 * (1 - c / 100) * (1 - black),
    g: 255 * (1 - m / 100) * (1 - black),
    b: 255 * (1 - y / 100) * (1 - black),
  });
}

function parseFunction(value: string, name: string): string[] | null {
  const match = value.match(new RegExp(`^${name}\\s*\\((.*)\\)$`, "i"));
  if (!match) return null;
  const body = match[1].trim();
  if (!body || body.includes("/")) return [];
  return body.includes(",")
    ? body.split(",").map((entry) => entry.trim())
    : body.split(/\s+/);
}

function parseHue(value: string): number {
  const hue = Number(value.replace(/deg$/i, ""));
  if (!Number.isFinite(hue) || hue < 0 || hue > 360) {
    throw new Error("Color hues must be between 0 and 360 degrees.");
  }
  return hue === 360 ? 0 : hue;
}

function parsePercentage(value: string): number {
  if (!value.endsWith("%")) {
    throw new Error("Color percentages must be between 0% and 100%.");
  }
  const percentage = Number(value.slice(0, -1));
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new Error("Color percentages must be between 0% and 100%.");
  }
  return percentage;
}

function parseRgbChannel(value: string): number {
  const percentage = value.endsWith("%");
  const channel = Number(percentage ? value.slice(0, -1) : value);
  const maximum = percentage ? 100 : 255;
  if (!Number.isFinite(channel) || channel < 0 || channel > maximum) {
    throw new Error("RGB channels must be between 0 and 255.");
  }
  return percentage ? (channel / 100) * 255 : channel;
}

function colorLuminance({ r, g, b }: RgbColor): number {
  const channels = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first: RgbColor, second: RgbColor): number {
  const lighter = Math.max(colorLuminance(first), colorLuminance(second));
  const darker = Math.min(colorLuminance(first), colorLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

function preferredContrast(rgb: RgbColor): {
  preferred: "#000000" | "#FFFFFF";
  blackRatio: number;
  whiteRatio: number;
} {
  const blackRatio = contrastRatio(rgb, { r: 0, g: 0, b: 0 });
  const whiteRatio = contrastRatio(rgb, { r: 255, g: 255, b: 255 });
  return {
    preferred: blackRatio >= whiteRatio ? "#000000" : "#FFFFFF",
    blackRatio: Number(blackRatio.toFixed(2)),
    whiteRatio: Number(whiteRatio.toFixed(2)),
  };
}

function mixColor(
  source: RgbColor,
  target: RgbColor,
  amount: number,
): RgbColor {
  return normalizeRgb({
    r: source.r + (target.r - source.r) * amount,
    g: source.g + (target.g - source.g) * amount,
    b: source.b + (target.b - source.b) * amount,
  });
}

function createPalette(source: RgbColor): ColorPaletteEntry[] {
  const variants: Array<[number, RgbColor, number]> = [
    [50, { r: 255, g: 255, b: 255 }, 0.9],
    [100, { r: 255, g: 255, b: 255 }, 0.75],
    [200, { r: 255, g: 255, b: 255 }, 0.55],
    [300, { r: 255, g: 255, b: 255 }, 0.35],
    [400, { r: 255, g: 255, b: 255 }, 0.17],
    [500, source, 0],
    [600, { r: 0, g: 0, b: 0 }, 0.15],
    [700, { r: 0, g: 0, b: 0 }, 0.32],
    [800, { r: 0, g: 0, b: 0 }, 0.5],
    [900, { r: 0, g: 0, b: 0 }, 0.67],
  ];
  return variants.map(([step, target, amount]) => {
    const rgb = mixColor(source, target, amount);
    return {
      step,
      hex: rgbToHex(rgb),
      contrast: preferredContrast(rgb).preferred,
    };
  });
}

function createCss(
  source: RgbColor,
  hsl: HslColor,
  complementary: string,
  contrast: "#000000" | "#FFFFFF",
  palette: ColorPaletteEntry[],
): string {
  const lines = [
    ":root {",
    `  --color-primary: ${rgbToHex(source)};`,
    `  --color-primary-rgb: ${source.r} ${source.g} ${source.b};`,
    `  --color-primary-hsl: ${hsl.h} ${hsl.s}% ${hsl.l}%;`,
    `  --color-primary-contrast: ${contrast};`,
    `  --color-primary-complement: ${complementary};`,
  ];
  for (const entry of palette) {
    lines.push(`  --color-primary-${entry.step}: ${entry.hex};`);
  }
  lines.push("}");
  return lines.join("\n");
}

export function extractColorInput(input: string): string {
  assertInputLimit(input, TOOL_LIMITS.file);
  const value = input.trim();
  if (!value) return value;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      parsed &&
      typeof parsed === "object" &&
      "hex" in parsed &&
      typeof parsed.hex === "string"
    ) {
      return parsed.hex.trim();
    }
  } catch {
    // Plain text and CSS imports are handled below.
  }
  const cssVariable = value.match(/--color-primary\s*:\s*([^;\n]+)/i);
  if (cssVariable?.[1]) return cssVariable[1].trim();
  const colorToken = value.match(
    /#(?:[\da-f]{3}|[\da-f]{6})\b|(?:rgb|hsl|hsv|cmyk)\s*\([^)]*\)/i,
  );
  return colorToken?.[0] ?? value;
}

export function parseColor(input: string): ColorValue {
  assertInputLimit(input, TOOL_LIMITS.text);
  const value = input.trim();
  let rgb: RgbColor | null = null;
  const hexMatch = value.match(/^#?([\da-f]{3}|[\da-f]{6})$/i);
  if (hexMatch) {
    const raw =
      hexMatch[1].length === 3
        ? Array.from(hexMatch[1])
            .map((part) => part + part)
            .join("")
        : hexMatch[1];
    rgb = {
      r: Number.parseInt(raw.slice(0, 2), 16),
      g: Number.parseInt(raw.slice(2, 4), 16),
      b: Number.parseInt(raw.slice(4, 6), 16),
    };
  }

  const rgbArguments = parseFunction(value, "rgb");
  const plainRgb = value.match(
    /^([+-]?(?:\d+\.?\d*|\.\d+))\s*,\s*([+-]?(?:\d+\.?\d*|\.\d+))\s*,\s*([+-]?(?:\d+\.?\d*|\.\d+))$/,
  );
  if (!rgb && rgbArguments) {
    if (rgbArguments.length !== 3) throw new Error("Invalid color input.");
    rgb = normalizeRgb({
      r: parseRgbChannel(rgbArguments[0]),
      g: parseRgbChannel(rgbArguments[1]),
      b: parseRgbChannel(rgbArguments[2]),
    });
  } else if (!rgb && plainRgb) {
    rgb = normalizeRgb({
      r: parseRgbChannel(plainRgb[1]),
      g: parseRgbChannel(plainRgb[2]),
      b: parseRgbChannel(plainRgb[3]),
    });
  }

  const hslArguments = parseFunction(value, "hsl");
  if (!rgb && hslArguments) {
    if (hslArguments.length !== 3) throw new Error("Invalid color input.");
    rgb = hslToRgb({
      h: parseHue(hslArguments[0]),
      s: parsePercentage(hslArguments[1]),
      l: parsePercentage(hslArguments[2]),
    });
  }

  const hsvArguments = parseFunction(value, "hsv");
  if (!rgb && hsvArguments) {
    if (hsvArguments.length !== 3) throw new Error("Invalid color input.");
    rgb = hsvToRgb({
      h: parseHue(hsvArguments[0]),
      s: parsePercentage(hsvArguments[1]),
      v: parsePercentage(hsvArguments[2]),
    });
  }

  const cmykArguments = parseFunction(value, "cmyk");
  if (!rgb && cmykArguments) {
    if (cmykArguments.length !== 4) throw new Error("Invalid color input.");
    rgb = cmykToRgb({
      c: parsePercentage(cmykArguments[0]),
      m: parsePercentage(cmykArguments[1]),
      y: parsePercentage(cmykArguments[2]),
      k: parsePercentage(cmykArguments[3]),
    });
  }

  if (!rgb) {
    throw new Error("Enter a valid HEX, RGB, HSL, HSV, or CMYK color value.");
  }

  const hsl = rgbToHsl(rgb);
  const complementaryRgb = hslToRgb({ ...hsl, h: (hsl.h + 180) % 360 });
  const complementaryHsl = rgbToHsl(complementaryRgb);
  const complementaryHex = rgbToHex(complementaryRgb);
  const contrast = preferredContrast(rgb);
  const palette = createPalette(rgb);
  return {
    hex: rgbToHex(rgb),
    rgb,
    hsl,
    hsv: rgbToHsv(rgb),
    cmyk: rgbToCmyk(rgb),
    complementary: {
      hex: complementaryHex,
      rgb: complementaryRgb,
      hsl: complementaryHsl,
    },
    contrast,
    palette,
    css: createCss(rgb, hsl, complementaryHex, contrast.preferred, palette),
  };
}
