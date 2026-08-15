import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "edge") {
    const { initializeDatabase } = await import("@/server/db/database");
    await initializeDatabase();
  }
}

export const onRequestError: Instrumentation.onRequestError = async () => {
  if (process.env.NEXT_RUNTIME !== "edge") {
    const { incrementDailyMetric } = await import("@/server/db/metrics");
    await incrementDailyMetric("error_count");
  }
};
