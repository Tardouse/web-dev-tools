"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  CircleAlert,
  Download,
  ImageIcon,
  ScanLine,
  WandSparkles,
} from "lucide-react";
import { downloadBytes } from "@/lib/clipboard";
import { formatBytes, TOOL_LIMITS } from "@/lib/config";
import {
  analyzeImageColors,
  centerCropRect,
  fitImageDimensions,
  isImageDataUrl,
  type ImageColorAnalysis,
} from "@/lib/tools";
import type { ToolComponentProps } from "@/lib/types";
import { ActionButton, CopyButton } from "./tool-actions";

type ImageOperation = "resize" | "crop" | "favicon";
type ImageFormat = "image/png" | "image/jpeg" | "image/webp";
type CropAspect = "1:1" | "4:3" | "16:9";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The image could not be decoded."));
    image.src = url;
  });
}

function canvasBlob(
  canvas: HTMLCanvasElement,
  type: ImageFormat,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("The browser could not encode this image.")),
      type,
      quality,
    );
  });
}

function blobDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(reader.error ?? new Error("The image could not be read."));
    reader.readAsDataURL(blob);
  });
}

const formatExtensions: Record<ImageFormat, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function ImageWorkbenchTool({ locale, messages }: ToolComponentProps) {
  const zh = locale === "zh";
  const [tab, setTab] = useState<"file" | "base64">("file");
  const [sourceUrl, setSourceUrl] = useState("");
  const sourceObjectUrl = useRef("");
  const outputObjectUrl = useRef("");
  const [sourceName, setSourceName] = useState("image");
  const [sourceSize, setSourceSize] = useState(0);
  const [sourceDimensions, setSourceDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [operation, setOperation] = useState<ImageOperation>("resize");
  const [format, setFormat] = useState<ImageFormat>("image/webp");
  const [maxWidth, setMaxWidth] = useState(1200);
  const [maxHeight, setMaxHeight] = useState(1200);
  const [preserveAspect, setPreserveAspect] = useState(true);
  const [cropAspect, setCropAspect] = useState<CropAspect>("1:1");
  const [quality, setQuality] = useState(82);
  const [outputUrl, setOutputUrl] = useState("");
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputDimensions, setOutputDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [base64, setBase64] = useState("");
  const [base64Input, setBase64Input] = useState("");
  const [exif, setExif] = useState<Record<string, unknown>>({});
  const [colors, setColors] = useState<ImageColorAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    () => () => {
      if (sourceObjectUrl.current) URL.revokeObjectURL(sourceObjectUrl.current);
      if (outputObjectUrl.current) URL.revokeObjectURL(outputObjectUrl.current);
    },
    [],
  );

  const setSource = async (
    url: string,
    name: string,
    size: number,
    file?: File,
  ) => {
    const image = await loadImage(url);
    setSourceUrl(url);
    setSourceName(name.replace(/\.[^.]+$/, "") || "image");
    setSourceSize(size);
    setSourceDimensions({
      width: image.naturalWidth,
      height: image.naturalHeight,
    });
    setMaxWidth(Math.min(image.naturalWidth, 1600));
    setMaxHeight(Math.min(image.naturalHeight, 1600));
    setOutputUrl("");
    setOutputBlob(null);
    setColors(null);
    setBase64("");
    if (file) {
      try {
        const { parse } = await import("exifr");
        const metadata = (await parse(file, {
          sanitize: true,
          gps: false,
        })) as Record<string, unknown> | undefined;
        setExif(metadata ?? {});
      } catch {
        setExif({});
      }
    } else {
      setExif({});
    }
  };

  const chooseImage = async (file: File) => {
    setError("");
    if (file.size > TOOL_LIMITS.image) {
      setError(
        zh
          ? `图片不能超过 ${formatBytes(TOOL_LIMITS.image)}。`
          : `Images cannot exceed ${formatBytes(TOOL_LIMITS.image)}.`,
      );
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError(
        zh
          ? "请选择 PNG、JPG、WebP 或 GIF 图片。"
          : "Choose a PNG, JPG, WebP, or GIF image.",
      );
      return;
    }
    if (sourceObjectUrl.current) URL.revokeObjectURL(sourceObjectUrl.current);
    const url = URL.createObjectURL(file);
    sourceObjectUrl.current = url;
    try {
      await setSource(url, file.name, file.size, file);
    } catch (caught) {
      URL.revokeObjectURL(url);
      sourceObjectUrl.current = "";
      setError(
        caught instanceof Error ? caught.message : "Image loading failed.",
      );
    }
  };

  const loadBase64 = async () => {
    setError("");
    const value = base64Input.trim();
    if (!isImageDataUrl(value)) {
      setError(
        zh
          ? "请输入有效的 PNG、JPG、WebP 或 GIF Base64 Data URL。"
          : "Enter a valid PNG, JPG, WebP, or GIF Base64 data URL.",
      );
      return;
    }
    if (value.length > Math.ceil((TOOL_LIMITS.image * 4) / 3) + 1024) {
      setError(
        zh
          ? "Base64 图片超过大小限制。"
          : "The Base64 image exceeds the size limit.",
      );
      return;
    }
    try {
      await setSource(
        value,
        "base64-image",
        Math.floor((value.split(",")[1]?.length ?? 0) * 0.75),
      );
      setTab("file");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Base64 decoding failed.",
      );
    }
  };

  const process = async () => {
    if (!sourceUrl) return;
    setBusy(true);
    setError("");
    try {
      const image = await loadImage(sourceUrl);
      let source = {
        x: 0,
        y: 0,
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
      let dimensions;
      if (operation === "favicon") {
        source = centerCropRect(image.naturalWidth, image.naturalHeight, 1, 1);
        dimensions = { width: 32, height: 32 };
      } else if (operation === "crop") {
        const [aspectWidth, aspectHeight] = cropAspect.split(":").map(Number);
        source = centerCropRect(
          image.naturalWidth,
          image.naturalHeight,
          aspectWidth,
          aspectHeight,
        );
        dimensions = fitImageDimensions(
          source.width,
          source.height,
          maxWidth,
          maxHeight,
          true,
        );
      } else {
        dimensions = fitImageDimensions(
          image.naturalWidth,
          image.naturalHeight,
          maxWidth,
          maxHeight,
          preserveAspect,
        );
      }
      if (dimensions.width * dimensions.height > 25_000_000) {
        throw new Error(
          zh
            ? "输出图片不能超过 2500 万像素。"
            : "Output images cannot exceed 25 million pixels.",
        );
      }
      const canvas = document.createElement("canvas");
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Canvas is unavailable in this browser.");
      if (format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        image,
        source.x,
        source.y,
        source.width,
        source.height,
        0,
        0,
        dimensions.width,
        dimensions.height,
      );
      const analysisCanvas = document.createElement("canvas");
      const analysisScale = Math.min(
        1,
        256 / Math.max(canvas.width, canvas.height),
      );
      analysisCanvas.width = Math.max(
        1,
        Math.round(canvas.width * analysisScale),
      );
      analysisCanvas.height = Math.max(
        1,
        Math.round(canvas.height * analysisScale),
      );
      const analysisContext = analysisCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (analysisContext) {
        analysisContext.drawImage(
          canvas,
          0,
          0,
          analysisCanvas.width,
          analysisCanvas.height,
        );
        setColors(
          analyzeImageColors(
            analysisContext.getImageData(
              0,
              0,
              analysisCanvas.width,
              analysisCanvas.height,
            ).data,
          ),
        );
      }
      const outputFormat = operation === "favicon" ? "image/png" : format;
      const blob = await canvasBlob(canvas, outputFormat, quality / 100);
      if (blob.size > TOOL_LIMITS.image) {
        throw new Error(
          zh
            ? "处理后的图片超过 20 MB，请降低尺寸或质量。"
            : "The processed image exceeds 20 MB; reduce its dimensions or quality.",
        );
      }
      if (outputObjectUrl.current) URL.revokeObjectURL(outputObjectUrl.current);
      const url = URL.createObjectURL(blob);
      outputObjectUrl.current = url;
      setOutputUrl(url);
      setOutputBlob(blob);
      setOutputDimensions(dimensions);
      setBase64(await blobDataUrl(blob));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Image processing failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const outputExtension =
    operation === "favicon" ? "png" : formatExtensions[format];
  return (
    <section className="tool-workspace card image-workbench">
      <div className="workspace-header">
        <h2>{zh ? "图片工作台" : "Image workbench"}</h2>
        <div className="segmented">
          <button aria-pressed={tab === "file"} onClick={() => setTab("file")}>
            {zh ? "图片处理" : "Process image"}
          </button>
          <button
            aria-pressed={tab === "base64"}
            onClick={() => setTab("base64")}
          >
            Base64 → {zh ? "图片" : "image"}
          </button>
        </div>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          {error}
        </div>
      )}
      {tab === "base64" ? (
        <div className="base64-image-input">
          <label className="field">
            <span>Base64 Data URL</span>
            <textarea
              aria-label={zh ? "Base64 图片数据" : "Base64 image data"}
              value={base64Input}
              onChange={(event) => setBase64Input(event.target.value)}
              placeholder="data:image/png;base64,..."
            />
          </label>
          <ActionButton
            icon={ScanLine}
            primary
            disabled={!base64Input.trim()}
            onClick={() => void loadBase64()}
          >
            {zh ? "解析图片" : "Decode image"}
          </ActionButton>
        </div>
      ) : (
        <>
          <div className="image-controls">
            <label className="image-file-button">
              <ImageIcon size={18} />
              <span>
                {sourceUrl
                  ? zh
                    ? "更换图片"
                    : "Replace image"
                  : zh
                    ? "选择图片"
                    : "Choose image"}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                aria-label={zh ? "选择要处理的图片" : "Choose image to process"}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void chooseImage(file);
                }}
              />
            </label>
            <div className="segmented">
              {(["resize", "crop", "favicon"] as const).map((item) => (
                <button
                  key={item}
                  aria-pressed={operation === item}
                  onClick={() => setOperation(item)}
                >
                  {item === "resize"
                    ? zh
                      ? "缩放 / 转换"
                      : "Resize / convert"
                    : item === "crop"
                      ? zh
                        ? "居中裁剪"
                        : "Center crop"
                      : "Favicon"}
                </button>
              ))}
            </div>
            {operation === "crop" && (
              <label className="field inline">
                <span>{zh ? "比例" : "Ratio"}</span>
                <select
                  aria-label={zh ? "裁剪比例" : "Crop ratio"}
                  value={cropAspect}
                  onChange={(event) =>
                    setCropAspect(event.target.value as CropAspect)
                  }
                >
                  <option>1:1</option>
                  <option>4:3</option>
                  <option>16:9</option>
                </select>
              </label>
            )}
            {operation !== "favicon" && (
              <>
                <label className="field inline">
                  <span>{zh ? "宽" : "Width"}</span>
                  <input
                    aria-label={zh ? "输出宽度" : "Output width"}
                    type="number"
                    min="1"
                    max="10000"
                    value={maxWidth}
                    onChange={(event) =>
                      setMaxWidth(Math.max(1, Number(event.target.value)))
                    }
                  />
                </label>
                <label className="field inline">
                  <span>{zh ? "高" : "Height"}</span>
                  <input
                    aria-label={zh ? "输出高度" : "Output height"}
                    type="number"
                    min="1"
                    max="10000"
                    value={maxHeight}
                    onChange={(event) =>
                      setMaxHeight(Math.max(1, Number(event.target.value)))
                    }
                  />
                </label>
              </>
            )}
            {operation === "resize" && (
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={preserveAspect}
                  onChange={(event) => setPreserveAspect(event.target.checked)}
                />
                {zh ? "保持比例" : "Keep aspect"}
              </label>
            )}
            {operation !== "favicon" && (
              <label className="field inline">
                <span>{zh ? "格式" : "Format"}</span>
                <select
                  aria-label={zh ? "输出格式" : "Output format"}
                  value={format}
                  onChange={(event) =>
                    setFormat(event.target.value as ImageFormat)
                  }
                >
                  <option value="image/png">PNG</option>
                  <option value="image/jpeg">JPG</option>
                  <option value="image/webp">WebP</option>
                </select>
              </label>
            )}
            {operation !== "favicon" && format !== "image/png" && (
              <label className="quality-control">
                <span>
                  {zh ? "质量" : "Quality"} {quality}%
                </span>
                <input
                  aria-label={zh ? "图片质量" : "Image quality"}
                  type="range"
                  min="20"
                  max="100"
                  value={quality}
                  onChange={(event) => setQuality(Number(event.target.value))}
                />
              </label>
            )}
            <ActionButton
              icon={WandSparkles}
              primary
              disabled={!sourceUrl || busy}
              onClick={() => void process()}
            >
              {busy
                ? zh
                  ? "处理中…"
                  : "Processing…"
                : zh
                  ? "处理图片"
                  : "Process image"}
            </ActionButton>
          </div>
          <div className="image-stage">
            <div className="image-pane">
              <div className="panel-label">
                <span>{zh ? "原图" : "Original"}</span>
                <span>
                  {sourceDimensions.width
                    ? `${sourceDimensions.width} × ${sourceDimensions.height} · ${formatBytes(sourceSize)}`
                    : ""}
                </span>
              </div>
              <div className="image-preview">
                {sourceUrl ? (
                  <Image
                    src={sourceUrl}
                    alt={zh ? "原图预览" : "Original preview"}
                    width={sourceDimensions.width || 800}
                    height={sourceDimensions.height || 600}
                    unoptimized
                  />
                ) : (
                  <div className="image-empty">
                    <ImageIcon size={34} />
                    <span>
                      {zh ? "请选择本地图片" : "Choose a local image"}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="image-pane">
              <div className="panel-label">
                <span>{zh ? "输出" : "Output"}</span>
                <span>
                  {outputBlob
                    ? `${outputDimensions.width} × ${outputDimensions.height} · ${formatBytes(outputBlob.size)}`
                    : ""}
                </span>
              </div>
              <div className="image-preview">
                {outputUrl ? (
                  <Image
                    src={outputUrl}
                    alt={zh ? "处理结果预览" : "Processed image preview"}
                    width={outputDimensions.width}
                    height={outputDimensions.height}
                    unoptimized
                  />
                ) : (
                  <div className="image-empty">
                    <WandSparkles size={34} />
                    <span>
                      {zh
                        ? "处理结果将显示在这里"
                        : "Processed output appears here"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {outputBlob && (
            <div className="image-results">
              <div className="image-result-actions">
                <ActionButton
                  icon={Download}
                  primary
                  onClick={() =>
                    downloadBytes(
                      outputBlob,
                      operation === "favicon"
                        ? "favicon.png"
                        : `${sourceName}.${outputExtension}`,
                      outputBlob.type,
                    )
                  }
                >
                  {zh ? "下载图片" : "Download image"}
                </ActionButton>
                <CopyButton
                  messages={messages}
                  value={base64}
                  label={zh ? "复制 Base64" : "Copy Base64"}
                />
                {sourceSize > 0 && (
                  <span
                    className={`badge ${outputBlob.size <= sourceSize ? "badge-success" : "badge-warning"}`}
                  >
                    {outputBlob.size <= sourceSize ? "−" : "+"}
                    {Math.abs(
                      Math.round((1 - outputBlob.size / sourceSize) * 100),
                    )}
                    %
                  </span>
                )}
              </div>
              {colors && (
                <div className="color-analysis">
                  <div>
                    <span>{zh ? "平均颜色" : "Average"}</span>
                    <i style={{ background: colors.average }} />
                    <code>{colors.average}</code>
                  </div>
                  <div>
                    <span>{zh ? "主要颜色" : "Palette"}</span>
                    {colors.palette.map((item) => (
                      <i
                        key={item.color}
                        style={{ background: item.color }}
                        title={item.color}
                      />
                    ))}
                  </div>
                </div>
              )}
              <details className="image-data">
                <summary>Base64 Data URL</summary>
                <textarea
                  readOnly
                  value={base64}
                  aria-label="Base64 Data URL"
                />
              </details>
            </div>
          )}
          {Object.keys(exif).length > 0 && (
            <details className="image-data exif-data">
              <summary>
                {zh
                  ? `EXIF / 图片元数据（${Object.keys(exif).length}）`
                  : `EXIF / image metadata (${Object.keys(exif).length})`}
              </summary>
              <pre>{JSON.stringify(exif, null, 2)}</pre>
            </details>
          )}
        </>
      )}
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {zh
            ? `浏览器本地 Canvas 处理 · 最大 ${formatBytes(TOOL_LIMITS.image)}`
            : `Local Canvas processing · ${formatBytes(TOOL_LIMITS.image)} maximum`}
        </span>
      </div>
    </section>
  );
}
