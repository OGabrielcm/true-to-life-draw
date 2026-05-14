import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:5174",
    headless: false,
    storageState: "tests/e2e/.auth-state.json",
    viewport: { width: 1280, height: 800 },
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Não sobe o dev server automaticamente — deve estar rodando antes
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5174",
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
