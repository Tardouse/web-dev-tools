import "server-only";

import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { hashPassword, isStrongPassword } from "@/server/auth/password";

const globalDatabase = globalThis as typeof globalThis & {
  devToolboxDatabase?: DatabaseSync;
  devToolboxDatabasePath?: string;
  devToolboxBootstrap?: Promise<void>;
};

export function normalizeDatabasePath(configured: string | undefined): string {
  const value = configured ?? "./data/devtoolbox.sqlite";
  return value === ":memory:"
    ? value
    : resolve(/* turbopackIgnore: true */ value);
}

function getDatabasePath(): string {
  return normalizeDatabasePath(process.env.DATABASE_PATH);
}

function createDatabase(path: string): DatabaseSync {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const database = new DatabaseSync(path, {
    enableForeignKeyConstraints: true,
    enableDoubleQuotedStringLiterals: false,
    allowExtension: false,
    timeout: 5_000,
  });
  database.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;");
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'super_admin')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
      must_change_password INTEGER NOT NULL DEFAULT 0 CHECK (must_change_password IN (0, 1)),
      password_version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_login_at TEXT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      password_version INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      last_active_at TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      user_agent TEXT NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS login_attempts (
      key_hash TEXT PRIMARY KEY,
      failures INTEGER NOT NULL DEFAULT 0,
      first_failure_at TEXT NOT NULL,
      locked_until TEXT,
      updated_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS tool_usage_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool_slug TEXT NOT NULL,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      visitor_id_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS idx_tool_usage_created ON tool_usage_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_tool_usage_user ON tool_usage_events(user_id);

    CREATE TABLE IF NOT EXISTS page_view_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      visitor_id_hash TEXT NOT NULL,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_view_events(created_at);

    CREATE TABLE IF NOT EXISTS daily_metrics (
      day TEXT PRIMARY KEY,
      api_requests INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0,
      file_count INTEGER NOT NULL DEFAULT 0,
      file_bytes INTEGER NOT NULL DEFAULT 0
    ) STRICT;

    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      actor_name TEXT NOT NULL,
      actor_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target_user_id TEXT,
      result TEXT NOT NULL CHECK (result IN ('success', 'failure')),
      ip_address TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_target ON admin_audit_logs(target_user_id);
  `);
  return database;
}

export function getDatabase(): DatabaseSync {
  const path = getDatabasePath();
  if (
    !globalDatabase.devToolboxDatabase ||
    globalDatabase.devToolboxDatabasePath !== path
  ) {
    globalDatabase.devToolboxDatabase?.close();
    globalDatabase.devToolboxDatabase = createDatabase(path);
    globalDatabase.devToolboxDatabasePath = path;
    globalDatabase.devToolboxBootstrap = undefined;
  }
  return globalDatabase.devToolboxDatabase;
}

export async function initializeDatabase(): Promise<void> {
  getDatabase();
  globalDatabase.devToolboxBootstrap ??= bootstrapSuperAdmin();
  await globalDatabase.devToolboxBootstrap;
}

async function bootstrapSuperAdmin(): Promise<void> {
  const database = getDatabase();
  const row = database
    .prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'super_admin'")
    .get() as { count: number };
  if (row.count > 0) return;

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "DevToolbox Admin";
  if (!email || !password) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("ADMIN_EMAIL must be a valid email address.");
  }
  if (!isStrongPassword(password)) {
    throw new Error(
      "ADMIN_PASSWORD must have 12+ characters with uppercase, lowercase, number, and symbol.",
    );
  }

  const now = new Date().toISOString();
  database
    .prepare(
      `INSERT INTO users (
        id, email, name, password_hash, role, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'super_admin', 'active', ?, ?)`,
    )
    .run(crypto.randomUUID(), email, name, await hashPassword(password), now, now);
}

export function closeDatabaseForTests(): void {
  globalDatabase.devToolboxDatabase?.close();
  globalDatabase.devToolboxDatabase = undefined;
  globalDatabase.devToolboxDatabasePath = undefined;
  globalDatabase.devToolboxBootstrap = undefined;
}
