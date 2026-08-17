"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import QRCode from "qrcode";
import { CircleAlert, Download, ScanLine } from "lucide-react";
import { byteLength, formatBytes, TOOL_LIMITS } from "@/lib/config";
import { localizeToolError } from "@/i18n/errors";
import { downloadText } from "@/lib/clipboard";
import {
  buildQrPayload,
  type QrMode,
  type QrTemplateValues,
} from "@/lib/tools/qr";
import { isToolTaskCancellation, runToolTask } from "@/lib/tool-execution";
import { ActionButton, CopyButton } from "./tool-actions";
import type { ToolComponentProps } from "@/lib/types";

const QR_MODES: QrMode[] = ["text", "wifi", "email", "vcard"];
const INITIAL_VALUES: QrTemplateValues = {
  text: "https://example.com",
  wifi: { ssid: "", password: "", security: "WPA", hidden: false },
  email: { to: "", subject: "", body: "" },
  vcard: {
    firstName: "",
    lastName: "",
    organization: "",
    phone: "",
    email: "",
    url: "",
  },
};

function readQrImage(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      try {
        const maxDimension = 2_000;
        const scale = Math.min(
          1,
          maxDimension / Math.max(image.naturalWidth, image.naturalHeight),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Unable to read this image.");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(context.getImageData(0, 0, canvas.width, canvas.height));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read this image."));
    };
    image.src = objectUrl;
  });
}

export function QrCodeTool({ definition, messages }: ToolComponentProps) {
  const [mode, setMode] = useState<QrMode>("text");
  const [values, setValues] = useState<QrTemplateValues>(INITIAL_VALUES);
  const [size, setSize] = useState(256);
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [pngUrl, setPngUrl] = useState("");
  const [svg, setSvg] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [scanResult, setScanResult] = useState("");
  const [scanError, setScanError] = useState("");
  const [scanning, setScanning] = useState(false);

  const payloadState = useMemo(() => {
    try {
      return { payload: buildQrPayload(mode, values), error: "" };
    } catch (caught) {
      return {
        payload: "",
        error:
          caught instanceof Error ? caught.message : "QR generation failed.",
      };
    }
  }, [mode, values]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (!payloadState.payload) {
        setPngUrl("");
        setSvg("");
        setGenerationError(payloadState.error);
        return;
      }
      try {
        const inputLimit = definition?.maxInputSize ?? TOOL_LIMITS.text;
        if (byteLength(payloadState.payload) > inputLimit) {
          throw new Error(
            `Input is ${formatBytes(byteLength(payloadState.payload))}. The limit for this tool is ${formatBytes(inputLimit)}.`,
          );
        }
        const generated = await runToolTask(
          async () =>
            Promise.all([
              QRCode.toDataURL(payloadState.payload, {
                width: size,
                margin: 2,
                errorCorrectionLevel: level,
                color: { dark: "#0f172a", light: "#ffffff" },
              }),
              QRCode.toString(payloadState.payload, {
                type: "svg",
                width: size,
                margin: 2,
                errorCorrectionLevel: level,
                color: { dark: "#0f172a", light: "#ffffff" },
              }),
            ]),
          definition,
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setPngUrl(generated[0]);
          setSvg(generated[1]);
          setGenerationError("");
        }
      } catch (caught) {
        if (isToolTaskCancellation(caught)) return;
        setPngUrl("");
        setSvg("");
        setGenerationError(
          caught instanceof Error
            ? localizeToolError(caught.message, messages)
            : "QR generation failed.",
        );
      }
    }, 100);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [definition, level, messages, payloadState, size]);

  const updateText = (text: string) =>
    setValues((current) => ({ ...current, text }));
  const updateWifi = (patch: Partial<QrTemplateValues["wifi"]>) =>
    setValues((current) => ({
      ...current,
      wifi: { ...current.wifi, ...patch },
    }));
  const updateEmail = (patch: Partial<QrTemplateValues["email"]>) =>
    setValues((current) => ({
      ...current,
      email: { ...current.email, ...patch },
    }));
  const updateVcard = (patch: Partial<QrTemplateValues["vcard"]>) =>
    setValues((current) => ({
      ...current,
      vcard: { ...current.vcard, ...patch },
    }));

  const downloadPng = () => {
    if (!pngUrl) return;
    const anchor = document.createElement("a");
    anchor.href = pngUrl;
    anchor.download = "qr-code.png";
    anchor.click();
  };

  const handleScan = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setScanResult("");
    setScanError("");
    const inputLimit = TOOL_LIMITS.file;
    if (file.size > inputLimit) {
      setScanError(
        localizeToolError(
          `Input is ${formatBytes(file.size)}. The limit for this tool is ${formatBytes(inputLimit)}.`,
          messages,
        ),
      );
      return;
    }
    setScanning(true);
    try {
      const { default: jsQR } = await import("jsqr");
      const imageData = await readQrImage(file);
      const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });
      if (!decoded) throw new Error("No QR code was found in this image.");
      setScanResult(decoded.data);
    } catch (caught) {
      setScanError(
        localizeToolError(
          caught instanceof Error
            ? caught.message
            : "No QR code was found in this image.",
          messages,
        ),
      );
    } finally {
      setScanning(false);
      event.target.value = "";
    }
  };

  const renderTemplateFields = () => {
    if (mode === "wifi") {
      return (
        <div className="qr-template-fields">
          <label className="field">
            <span>{messages.tool.qrSsid}</span>
            <input
              className="input"
              value={values.wifi.ssid}
              onChange={(event) => updateWifi({ ssid: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{messages.tool.qrPassword}</span>
            <input
              className="input"
              type="password"
              value={values.wifi.password}
              onChange={(event) => updateWifi({ password: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{messages.tool.qrSecurity}</span>
            <select
              className="select"
              aria-label={messages.tool.qrSecurity}
              value={values.wifi.security}
              onChange={(event) =>
                updateWifi({
                  security: event.target
                    .value as QrTemplateValues["wifi"]["security"],
                })
              }
            >
              <option value="WPA">{messages.tool.qrSecurityOptions.wpa}</option>
              <option value="WEP">{messages.tool.qrSecurityOptions.wep}</option>
              <option value="nopass">
                {messages.tool.qrSecurityOptions.open}
              </option>
            </select>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={values.wifi.hidden}
              onChange={(event) => updateWifi({ hidden: event.target.checked })}
            />
            {messages.tool.qrHidden}
          </label>
        </div>
      );
    }
    if (mode === "email") {
      return (
        <div className="qr-template-fields">
          <label className="field">
            <span>{messages.tool.qrEmailTo}</span>
            <input
              className="input"
              type="email"
              value={values.email.to}
              onChange={(event) => updateEmail({ to: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{messages.tool.qrSubject}</span>
            <input
              className="input"
              value={values.email.subject}
              onChange={(event) => updateEmail({ subject: event.target.value })}
            />
          </label>
          <label className="field qr-field-wide">
            <span>{messages.tool.qrBody}</span>
            <textarea
              className="editor qr-small-editor"
              value={values.email.body}
              onChange={(event) => updateEmail({ body: event.target.value })}
            />
          </label>
        </div>
      );
    }
    if (mode === "vcard") {
      return (
        <div className="qr-template-fields">
          <label className="field">
            <span>{messages.tool.qrFirstName}</span>
            <input
              className="input"
              value={values.vcard.firstName}
              onChange={(event) =>
                updateVcard({ firstName: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>{messages.tool.qrLastName}</span>
            <input
              className="input"
              value={values.vcard.lastName}
              onChange={(event) =>
                updateVcard({ lastName: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>{messages.tool.qrOrganization}</span>
            <input
              className="input"
              value={values.vcard.organization}
              onChange={(event) =>
                updateVcard({ organization: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>{messages.tool.qrPhone}</span>
            <input
              className="input"
              value={values.vcard.phone}
              onChange={(event) => updateVcard({ phone: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{messages.tool.qrEmailTo}</span>
            <input
              className="input"
              type="email"
              value={values.vcard.email}
              onChange={(event) => updateVcard({ email: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{messages.tool.qrWebsite}</span>
            <input
              className="input"
              type="url"
              value={values.vcard.url}
              onChange={(event) => updateVcard({ url: event.target.value })}
            />
          </label>
        </div>
      );
    }
    return (
      <label className="field qr-text-field">
        <span>{messages.tool.textOrUrl}</span>
        <textarea
          className="editor qr-text-editor"
          aria-label={messages.tool.textOrUrl}
          value={values.text}
          onChange={(event) => updateText(event.target.value)}
        />
      </label>
    );
  };

  return (
    <section className="tool-workspace card qr-workspace">
      <div className="workspace-header qr-header">
        <h2>{messages.tool.qrGenerator}</h2>
        <div className="workspace-actions qr-controls">
          <label className="field-label">
            {messages.tool.size}{" "}
            <select
              className="select"
              aria-label={messages.tool.size}
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
            >
              {[192, 256, 384, 512].map((item) => (
                <option key={item} value={item}>
                  {item}px
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            {messages.tool.correction}{" "}
            <select
              className="select"
              aria-label={messages.tool.correction}
              value={level}
              onChange={(event) => setLevel(event.target.value as typeof level)}
            >
              {(["L", "M", "Q", "H"] as const).map((item) => (
                <option value={item} key={item}>
                  {messages.tool.qrLevels[item]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div
        className="qr-mode-tabs"
        role="tablist"
        aria-label={messages.tool.qrGenerator}
      >
        {QR_MODES.map((item) => (
          <button
            type="button"
            role="tab"
            aria-selected={mode === item}
            key={item}
            onClick={() => setMode(item)}
          >
            {messages.tool.qrModes[item]}
          </button>
        ))}
      </div>
      {generationError && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          {localizeToolError(generationError, messages)}
        </div>
      )}
      <div className="qr-builder-grid">
        <div className="qr-builder-fields">{renderTemplateFields()}</div>
        <div className="qr-preview-panel">
          <div className="panel-label">{messages.tool.preview}</div>
          <div className="qr-output">
            {pngUrl ? (
              <Image
                src={pngUrl}
                alt={messages.tool.qrGenerator}
                width={size}
                height={size}
                unoptimized
              />
            ) : (
              <span className="muted">{messages.tool.qrEmpty}</span>
            )}
          </div>
          <div className="workspace-actions qr-download-actions">
            <ActionButton
              onClick={downloadPng}
              icon={Download}
              disabled={!pngUrl}
            >
              {messages.tool.downloadPng}
            </ActionButton>
            <ActionButton
              onClick={() => downloadText(svg, "qr-code.svg", "image/svg+xml")}
              icon={Download}
              disabled={!svg}
            >
              {messages.tool.downloadSvg}
            </ActionButton>
          </div>
          <details className="qr-payload-details">
            <summary>{messages.tool.qrPayload}</summary>
            <pre className="qr-payload-output">{payloadState.payload}</pre>
            <CopyButton messages={messages} value={payloadState.payload} />
          </details>
        </div>
      </div>
      <div className="qr-scanner-panel">
        <div className="qr-scanner-heading">
          <div>
            <h3>{messages.tool.qrScanner}</h3>
            <p className="muted">{messages.tool.qrScanEmpty}</p>
          </div>
          <ScanLine size={21} aria-hidden="true" />
        </div>
        <label className="field qr-file-field">
          <span>{messages.tool.qrScanFile}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleScan}
            aria-label={messages.tool.qrScanFile}
          />
        </label>
        {scanning && <p className="muted">{messages.tool.qrScanning}</p>}
        {scanError && (
          <div className="error-banner" role="alert">
            <CircleAlert size={17} />
            {scanError}
          </div>
        )}
        {scanResult && (
          <div className="qr-scan-result">
            <span className="field-label">{messages.tool.qrScanResult}</span>
            <code>{scanResult}</code>
            <CopyButton messages={messages} value={scanResult} />
          </div>
        )}
      </div>
      <div className="workspace-footer">
        <span className="workspace-footer-meta">{messages.tool.qrLocal}</span>
      </div>
    </section>
  );
}
