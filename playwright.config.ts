import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // The journey mutates seeded database state; run serially against one server.
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  // Production server: dev-mode on-demand compilation is too slow for stable e2e.
  webServer: {
    command: "npm run build && npm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 600_000
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
