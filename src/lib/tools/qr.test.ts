import { describe, expect, it } from "vitest";
import { buildQrPayload, type QrTemplateValues } from "./qr";

const values: QrTemplateValues = {
  text: "https://example.com",
  wifi: {
    ssid: "Dev; WiFi",
    password: "p;ass",
    security: "WPA",
    hidden: true,
  },
  email: {
    to: "dev@example.com",
    subject: "Build status",
    body: "The build is green.",
  },
  vcard: {
    firstName: "Ada",
    lastName: "Lovelace",
    organization: "Analytical Engine; Lab",
    phone: "+44 20 1234 5678",
    email: "ada@example.com",
    url: "https://example.com/ada",
  },
};

describe("QR payload templates", () => {
  it("keeps text and URL payloads unchanged", () => {
    expect(buildQrPayload("text", values)).toBe("https://example.com");
  });

  it("escapes WiFi fields and preserves hidden networks", () => {
    expect(buildQrPayload("wifi", values)).toBe(
      "WIFI:T:WPA;S:Dev\\; WiFi;P:p\\;ass;H:true;;",
    );
    expect(
      buildQrPayload("wifi", {
        ...values,
        wifi: { ...values.wifi, security: "nopass", password: "ignored" },
      }),
    ).toContain("T:nopass;S:Dev\\; WiFi;P:;H:true;;");
  });

  it("builds an encoded mailto payload", () => {
    expect(buildQrPayload("email", values)).toBe(
      "mailto:dev@example.com?subject=Build+status&body=The+build+is+green.",
    );
  });

  it("builds a vCard 3.0 payload with optional fields", () => {
    expect(buildQrPayload("vcard", values)).toContain(
      "N:Lovelace;Ada;;;\nFN:Ada Lovelace",
    );
    expect(buildQrPayload("vcard", values)).toContain(
      "ORG:Analytical Engine\\; Lab",
    );
    expect(buildQrPayload("vcard", values)).toMatch(/END:VCARD$/);
  });

  it("enforces the shared text limit for generated payloads", () => {
    expect(() =>
      buildQrPayload("text", { ...values, text: "x".repeat(1_048_577) }),
    ).toThrow("The limit for this tool");
  });
});
