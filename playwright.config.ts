import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/a11y",
  testMatch: "**/*.pw.ts",
  timeout: 20_000,
  fullyParallel: true,
  reporter: "list",
  use: {
    channel: process.env.PW_CHANNEL ?? "chrome",
    headless: true,
    viewport: { width: 900, height: 700 },
  },
});
