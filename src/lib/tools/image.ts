export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageColorAnalysis {
  average: string;
  palette: Array<{ color: string; count: number }>;
}

export function fitImageDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number,
  preserveAspect = true,
): ImageDimensions {
  for (const value of [sourceWidth, sourceHeight, maxWidth, maxHeight]) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("Image dimensions must be positive numbers.");
    }
  }
  if (!preserveAspect) {
    return { width: Math.round(maxWidth), height: Math.round(maxHeight) };
  }
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

export function centerCropRect(
  sourceWidth: number,
  sourceHeight: number,
  aspectWidth: number,
  aspectHeight: number,
): { x: number; y: number; width: number; height: number } {
  for (const value of [sourceWidth, sourceHeight, aspectWidth, aspectHeight]) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("Crop dimensions must be positive numbers.");
    }
  }
  const targetRatio = aspectWidth / aspectHeight;
  const sourceRatio = sourceWidth / sourceHeight;
  if (sourceRatio > targetRatio) {
    const width = Math.round(sourceHeight * targetRatio);
    return {
      x: Math.floor((sourceWidth - width) / 2),
      y: 0,
      width,
      height: sourceHeight,
    };
  }
  const height = Math.round(sourceWidth / targetRatio);
  return {
    x: 0,
    y: Math.floor((sourceHeight - height) / 2),
    width: sourceWidth,
    height,
  };
}

function hex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue]
    .map((value) =>
      Math.max(0, Math.min(255, Math.round(value)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export function analyzeImageColors(
  pixels: Uint8ClampedArray,
  maxPalette = 6,
): ImageColorAnalysis {
  if (pixels.length % 4 !== 0) throw new Error("Expected RGBA pixel data.");
  const buckets = new Map<
    string,
    { count: number; red: number; green: number; blue: number }
  >();
  let red = 0;
  let green = 0;
  let blue = 0;
  let weight = 0;
  const pixelCount = pixels.length / 4;
  const stride = Math.max(1, Math.ceil(pixelCount / 50_000));
  for (let pixel = 0; pixel < pixelCount; pixel += stride) {
    const offset = pixel * 4;
    const alpha = pixels[offset + 3] / 255;
    if (alpha < 0.05) continue;
    const r = pixels[offset];
    const g = pixels[offset + 1];
    const b = pixels[offset + 2];
    red += r * alpha;
    green += g * alpha;
    blue += b * alpha;
    weight += alpha;
    const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
    const bucket = buckets.get(key) ?? { count: 0, red: 0, green: 0, blue: 0 };
    bucket.count += 1;
    bucket.red += r;
    bucket.green += g;
    bucket.blue += b;
    buckets.set(key, bucket);
  }
  if (!weight) return { average: "#000000", palette: [] };
  const palette = [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.max(1, maxPalette))
    .map((bucket) => ({
      color: hex(
        bucket.red / bucket.count,
        bucket.green / bucket.count,
        bucket.blue / bucket.count,
      ),
      count: bucket.count,
    }));
  return {
    average: hex(red / weight, green / weight, blue / weight),
    palette,
  };
}

export function isImageDataUrl(value: string): boolean {
  return /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(
    value.trim(),
  );
}
