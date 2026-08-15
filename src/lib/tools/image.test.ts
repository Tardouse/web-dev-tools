import { describe, expect, it } from "vitest";
import {
  analyzeImageColors,
  centerCropRect,
  fitImageDimensions,
  isImageDataUrl,
} from "./image";

describe("image processing helpers", () => {
  it("resizes within a box while preserving aspect ratio", () => {
    expect(fitImageDimensions(1920, 1080, 800, 800)).toEqual({
      width: 800,
      height: 450,
    });
    expect(fitImageDimensions(1920, 1080, 800, 600, false)).toEqual({
      width: 800,
      height: 600,
    });
  });

  it("calculates centered crop rectangles", () => {
    expect(centerCropRect(1200, 800, 1, 1)).toEqual({
      x: 200,
      y: 0,
      width: 800,
      height: 800,
    });
    expect(centerCropRect(800, 1200, 16, 9)).toEqual({
      x: 0,
      y: 375,
      width: 800,
      height: 450,
    });
  });

  it("computes average and dominant colors while ignoring transparency", () => {
    const pixels = new Uint8ClampedArray([
      255, 0, 0, 255, 255, 0, 0, 255, 0, 0, 255, 255, 255, 255, 255, 0,
    ]);
    const result = analyzeImageColors(pixels, 2);
    expect(result.average).toBe("#aa0055");
    expect(result.palette[0]).toMatchObject({ color: "#ff0000", count: 2 });
  });

  it("accepts supported image Base64 data URLs only", () => {
    expect(isImageDataUrl("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
    expect(isImageDataUrl("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
  });
});
