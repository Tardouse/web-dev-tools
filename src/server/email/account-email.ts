import "server-only";

import { appendFile, chmod, mkdir } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import nodemailer from "nodemailer";
import { localePath, type Locale } from "@/i18n";
import { SITE_CONFIG } from "@/lib/config";

export type AccountEmailPurpose = "email_verification" | "password_reset";

interface AccountEmailInput {
  to: string;
  purpose: AccountEmailPurpose;
  locale: Locale;
  token: string;
  expiresAt: string;
}

function accountLink(input: AccountEmailInput): string {
  const pathname = input.purpose === "email_verification"
    ? "/verify-email"
    : "/reset-password";
  const url = new URL(localePath(input.locale, pathname), SITE_CONFIG.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use http or https.");
  }
  url.searchParams.set("token", input.token);
  return url.toString();
}

function content(input: AccountEmailInput, link: string) {
  const zh = input.locale === "zh";
  const verifying = input.purpose === "email_verification";
  const subject = verifying
    ? zh ? "验证您的 DevToolbox 邮箱" : "Verify your DevToolbox email"
    : zh ? "重置您的 DevToolbox 密码" : "Reset your DevToolbox password";
  const intro = verifying
    ? zh ? "请使用下面的链接验证您的邮箱地址。" : "Use the link below to verify your email address."
    : zh ? "请使用下面的链接设置新密码。" : "Use the link below to set a new password.";
  const expiry = new Date(input.expiresAt).toLocaleString(
    zh ? "zh-CN" : "en-US",
    { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" },
  );
  const expiryText = zh
    ? `此链接将在 ${expiry} UTC 失效，且只能使用一次。`
    : `This single-use link expires at ${expiry} UTC.`;
  const ignore = zh
    ? "如果这不是您的操作，可以忽略此邮件。"
    : "If you did not request this, you can ignore this email.";
  const escapedLink = link.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  return {
    subject,
    text: `${intro}\n\n${link}\n\n${expiryText}\n${ignore}`,
    html: `<p>${intro}</p><p><a href="${escapedLink}">${verifying ? (zh ? "验证邮箱" : "Verify email") : (zh ? "重置密码" : "Reset password")}</a></p><p>${expiryText}</p><p>${ignore}</p>`,
  };
}

function outboxPath(): string {
  const path = resolve(
    /* turbopackIgnore: true */ process.env.MAIL_OUTBOX_PATH ?? ".tmp/mail-outbox.jsonl",
  );
  const publicDirectory = resolve("public");
  const fromPublic = relative(publicDirectory, path);
  if (fromPublic === "" || (!fromPublic.startsWith("..") && !fromPublic.startsWith("/"))) {
    throw new Error("MAIL_OUTBOX_PATH cannot be inside the public directory.");
  }
  return path;
}

async function writeOutbox(input: AccountEmailInput, link: string): Promise<void> {
  if (process.env.NODE_ENV === "production" && process.env.MAIL_ALLOW_FILE_OUTBOX !== "1") {
    throw new Error("File email outbox is disabled in production.");
  }
  const path = outboxPath();
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const message = content(input, link);
  await appendFile(
    path,
    `${JSON.stringify({
      to: input.to,
      purpose: input.purpose,
      subject: message.subject,
      text: message.text,
      html: message.html,
      link,
      createdAt: new Date().toISOString(),
    })}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  await chmod(path, 0o600);
}

async function sendSmtp(input: AccountEmailInput, link: string): Promise<void> {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.MAIL_FROM?.trim();
  const port = Number(process.env.SMTP_PORT ?? "587");
  if (!host || !from || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_HOST, MAIL_FROM, and a valid SMTP_PORT are required.");
  }
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  if ((user && !password) || (!user && password)) {
    throw new Error("SMTP_USER and SMTP_PASSWORD must be configured together.");
  }
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && password ? { user, pass: password } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  const message = content(input, link);
  await transport.sendMail({
    from,
    to: input.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

export async function sendAccountEmail(input: AccountEmailInput): Promise<void> {
  const transport = process.env.MAIL_TRANSPORT
    ?? (process.env.NODE_ENV === "production" ? "smtp" : "outbox");
  const link = accountLink(input);
  if (transport === "outbox") {
    await writeOutbox(input, link);
    return;
  }
  if (transport !== "smtp") throw new Error("MAIL_TRANSPORT must be smtp or outbox.");
  await sendSmtp(input, link);
}
