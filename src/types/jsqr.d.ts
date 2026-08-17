declare module "jsqr" {
  export interface JsQrResult {
    data: string;
    binaryData: number[];
    version: number;
    location: {
      topRightCorner: { x: number; y: number };
      topLeftCorner: { x: number; y: number };
      bottomRightCorner: { x: number; y: number };
      bottomLeftCorner: { x: number; y: number };
      topRightFinderPattern: { x: number; y: number };
      topLeftFinderPattern: { x: number; y: number };
      bottomLeftFinderPattern: { x: number; y: number };
    };
  }

  export interface JsQrOptions {
    inversionAttempts?: "dontInvert" | "onlyInvert" | "attemptBoth";
  }

  const jsQR: (
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
    options?: JsQrOptions,
  ) => JsQrResult | null;

  export default jsQR;
}
