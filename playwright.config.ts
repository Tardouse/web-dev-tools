import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const e2eDatabasePath = resolve(".tmp/e2e-data/test.sqlite");
const e2eOutboxPath = resolve(".tmp/e2e-data/mail-outbox.jsonl");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3479",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command:
      `rm -rf .tmp/e2e-data && mkdir -p .tmp/e2e-data && NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3479 DATABASE_PATH='${e2eDatabasePath}' ADMIN_USERNAME=admin ADMIN_NAME='DevToolbox Admin' ADMIN_PASSWORD='E2e-Admin-Password-2026!' npm run build && NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3479 DATABASE_PATH='${e2eDatabasePath}' ADMIN_USERNAME=admin ADMIN_NAME='DevToolbox Admin' ADMIN_PASSWORD='E2e-Admin-Password-2026!' MAIL_TRANSPORT=outbox MAIL_ALLOW_FILE_OUTBOX=1 MAIL_OUTBOX_PATH='${e2eOutboxPath}' PORT=3479 npm start`,
    url: "http://127.0.0.1:3479",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
