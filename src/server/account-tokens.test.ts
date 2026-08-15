// @vitest-environment node

import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  consumeEmailVerification,
  consumePasswordReset,
  inspectAccountToken,
  requestEmailVerification,
  requestPasswordReset,
  sendRegistrationVerification,
} from "@/server/auth/account-tokens";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import {
  closeDatabaseForTests,
  getDatabase,
  initializeDatabase,
} from "@/server/db/database";

const testDirectory = mkdtempSync(join(tmpdir(), "devtoolbox-account-tokens-"));
const outboxPath = join(testDirectory, "outbox.jsonl");
const currentPassword = "Current-Password-2026!";
const replacementPassword = "Replacement-Password-2026!";

interface OutboxMessage {
  to: string;
  purpose: "email_verification" | "password_reset";
  link: string;
}

function outbox(): OutboxMessage[] {
  if (!existsSync(outboxPath)) return [];
  return readFileSync(outboxPath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as OutboxMessage);
}

function tokenFrom(message: OutboxMessage): string {
  const token = new URL(message.link).searchParams.get("token");
  if (!token) throw new Error("Outbox message has no token.");
  return token;
}

async function addUser(input: { email: string; verified: boolean }): Promise<string> {
  const id = randomUUID();
  const now = new Date().toISOString();
  getDatabase()
    .prepare(
      `INSERT INTO users (
        id, email, username, name, password_hash, role, status,
        must_change_password, password_version, email_verified_at, created_at, updated_at
      ) VALUES (?, ?, NULL, 'Test User', ?, 'user', 'active', 0, 1, ?, ?, ?)`,
    )
    .run(
      id,
      input.email,
      await hashPassword(currentPassword),
      input.verified ? now : null,
      now,
      now,
    );
  return id;
}

beforeEach(async () => {
  closeDatabaseForTests();
  process.env.DATABASE_PATH = ":memory:";
  process.env.MAIL_TRANSPORT = "outbox";
  process.env.MAIL_OUTBOX_PATH = outboxPath;
  delete process.env.ADMIN_USERNAME;
  delete process.env.ADMIN_PASSWORD;
  writeFileSync(outboxPath, "", { mode: 0o600 });
  await initializeDatabase();
});

afterEach(() => closeDatabaseForTests());
afterAll(() => rmSync(testDirectory, { recursive: true, force: true }));

describe("email verification tokens", () => {
  it("stores only token hashes and invalidates the previous link", async () => {
    const email = "unverified@example.com";
    const userId = await addUser({ email, verified: false });
    expect(await sendRegistrationVerification(userId, email, "en", "198.51.100.1")).toBe("sent");
    const firstToken = tokenFrom(outbox()[0]);
    const stored = getDatabase()
      .prepare("SELECT token_hash FROM account_tokens WHERE user_id = ?")
      .get(userId) as { token_hash: string };
    expect(stored.token_hash).not.toBe(firstToken);
    expect(stored.token_hash).toHaveLength(64);
    expect(await inspectAccountToken(firstToken, "email_verification")).toBe("valid");

    await requestEmailVerification(email, "en", "198.51.100.1");
    const secondToken = tokenFrom(outbox()[1]);
    expect(secondToken).not.toBe(firstToken);
    expect(await inspectAccountToken(firstToken, "email_verification")).toBe("used");
    expect(await inspectAccountToken(secondToken, "email_verification")).toBe("valid");
  });

  it("consumes a link once and marks the account verified", async () => {
    const email = "verify@example.com";
    const userId = await addUser({ email, verified: false });
    await sendRegistrationVerification(userId, email, "zh", "198.51.100.2");
    const token = tokenFrom(outbox()[0]);
    expect(await consumeEmailVerification(token)).toBe("success");
    expect(await consumeEmailVerification(token)).toBe("used");
    const row = getDatabase()
      .prepare("SELECT email_verified_at FROM users WHERE id = ?")
      .get(userId) as { email_verified_at: string | null };
    expect(row.email_verified_at).not.toBeNull();
  });

  it("limits verification messages per email without storing raw identifiers", async () => {
    const email = "limited@example.com";
    await addUser({ email, verified: false });
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await requestEmailVerification(email, "en", `198.51.100.${10 + attempt}`);
    }
    expect(outbox()).toHaveLength(3);
    const rows = getDatabase()
      .prepare("SELECT key_hash FROM account_request_limits")
      .all() as unknown as Array<{ key_hash: string }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.key_hash.length === 64)).toBe(true);
    expect(JSON.stringify(rows)).not.toContain(email);
    expect(JSON.stringify(rows)).not.toContain("198.51.100");
  });
});

describe("password recovery tokens", () => {
  it("returns the same public result for known and unknown emails", async () => {
    await addUser({ email: "known@example.com", verified: true });
    await expect(requestPasswordReset("missing@example.com", "en", "203.0.113.1")).resolves.toBeUndefined();
    await expect(requestPasswordReset("known@example.com", "en", "203.0.113.1")).resolves.toBeUndefined();
  });

  it("rejects expired links", async () => {
    const email = "expired@example.com";
    await addUser({ email, verified: true });
    await requestPasswordReset(email, "en", "203.0.113.2");
    const token = tokenFrom(outbox()[0]);
    getDatabase()
      .prepare("UPDATE account_tokens SET expires_at = ? WHERE purpose = 'password_reset'")
      .run(new Date(Date.now() - 1_000).toISOString());
    expect(await inspectAccountToken(token, "password_reset")).toBe("expired");
    expect(await consumePasswordReset(token, replacementPassword)).toBe("expired");
  });

  it("updates the password version, revokes sessions, and consumes the link", async () => {
    const email = "reset@example.com";
    const userId = await addUser({ email, verified: true });
    const now = new Date();
    getDatabase()
      .prepare(
        `INSERT INTO sessions (
          token_hash, user_id, audience, password_version, created_at, expires_at,
          last_active_at, ip_address, user_agent
        ) VALUES ('session-hash', ?, 'user', 1, ?, ?, ?, '203.0.113.3', 'test')`,
      )
      .run(
        userId,
        now.toISOString(),
        new Date(now.getTime() + 60_000).toISOString(),
        now.toISOString(),
      );
    await requestPasswordReset(email, "zh", "203.0.113.3");
    const token = tokenFrom(outbox()[0]);

    expect(await consumePasswordReset(token, replacementPassword)).toBe("success");
    expect(await consumePasswordReset(token, replacementPassword)).toBe("used");
    const user = getDatabase()
      .prepare("SELECT password_hash, password_version FROM users WHERE id = ?")
      .get(userId) as { password_hash: string; password_version: number };
    expect(user.password_version).toBe(2);
    expect(await verifyPassword(replacementPassword, user.password_hash)).toBe(true);
    expect(await verifyPassword(currentPassword, user.password_hash)).toBe(false);
    const sessions = getDatabase()
      .prepare("SELECT COUNT(*) AS count FROM sessions WHERE user_id = ?")
      .get(userId) as { count: number };
    expect(sessions.count).toBe(0);
  });
});

describe("database migration", () => {
  it("grandfathers existing normal users as verified", async () => {
    closeDatabaseForTests();
    const path = join(testDirectory, "legacy.sqlite");
    rmSync(path, { force: true });
    const legacy = new DatabaseSync(path);
    legacy.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE COLLATE NOCASE,
        username TEXT UNIQUE COLLATE NOCASE,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        must_change_password INTEGER NOT NULL DEFAULT 0,
        password_version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_login_at TEXT
      ) STRICT;
    `);
    const createdAt = "2026-01-02T03:04:05.000Z";
    legacy
      .prepare(
        `INSERT INTO users (
          id, email, username, name, password_hash, role, status, created_at, updated_at
        ) VALUES (?, 'legacy@example.com', NULL, 'Legacy', 'hash', 'user', 'active', ?, ?)`,
      )
      .run(randomUUID(), createdAt, createdAt);
    legacy.close();

    process.env.DATABASE_PATH = path;
    await initializeDatabase();
    const migrated = getDatabase()
      .prepare("SELECT email_verified_at FROM users WHERE email = 'legacy@example.com'")
      .get() as { email_verified_at: string | null };
    expect(migrated.email_verified_at).toBe(createdAt);
  });
});
