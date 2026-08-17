import { TOOL_LIMITS, assertInputLimit } from "@/lib/config";

export type QrMode = "text" | "wifi" | "email" | "vcard";

export interface QrTemplateValues {
  text: string;
  wifi: {
    ssid: string;
    password: string;
    security: "WPA" | "WEP" | "nopass";
    hidden: boolean;
  };
  email: {
    to: string;
    subject: string;
    body: string;
  };
  vcard: {
    firstName: string;
    lastName: string;
    organization: string;
    phone: string;
    email: string;
    url: string;
  };
}

function trimLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function escapeWifi(value: string): string {
  return trimLine(value).replace(/[\\;,:"]/g, "\\$&");
}

function escapeVcard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/([,;])/g, "\\$1")
    .replace(/\r?\n/g, "\\n")
    .trim();
}

function buildWifiPayload(values: QrTemplateValues["wifi"]): string {
  const security = values.security === "nopass" ? "nopass" : values.security;
  return [
    "WIFI:",
    `T:${security};`,
    `S:${escapeWifi(values.ssid)};`,
    `P:${security === "nopass" ? "" : escapeWifi(values.password)};`,
    `H:${values.hidden ? "true" : "false"};;`,
  ].join("");
}

function buildEmailPayload(values: QrTemplateValues["email"]): string {
  const recipient = trimLine(values.to);
  const params = new URLSearchParams();
  const subject = trimLine(values.subject);
  if (subject) params.set("subject", subject);
  if (values.body) params.set("body", values.body.replace(/\r\n/g, "\n"));
  const query = params.toString();
  return `mailto:${recipient}${query ? `?${query}` : ""}`;
}

function buildVcardPayload(values: QrTemplateValues["vcard"]): string {
  const firstName = trimLine(values.firstName);
  const lastName = trimLine(values.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVcard(lastName)};${escapeVcard(firstName)};;;`,
    `FN:${escapeVcard(fullName)}`,
  ];
  const optionalFields: Array<[string, string]> = [
    ["ORG", values.organization],
    ["TEL", values.phone],
    ["EMAIL", values.email],
    ["URL", values.url],
  ];
  for (const [name, value] of optionalFields) {
    if (value.trim()) lines.push(`${name}:${escapeVcard(value)}`);
  }
  lines.push("END:VCARD");
  return lines.join("\n");
}

export function buildQrPayload(mode: QrMode, values: QrTemplateValues): string {
  const payload =
    mode === "wifi"
      ? buildWifiPayload(values.wifi)
      : mode === "email"
        ? buildEmailPayload(values.email)
        : mode === "vcard"
          ? buildVcardPayload(values.vcard)
          : values.text;
  assertInputLimit(payload, TOOL_LIMITS.text);
  return payload;
}
