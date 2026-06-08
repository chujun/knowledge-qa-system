import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: "npm run dev -- -p 3100",
    env: {
      DATABASE_URL: "file:./dev.db",
      KNOWLEDGE_QA_API_KEY: "local-dev-key"
    },
    url: "http://127.0.0.1:3100",
    reuseExistingServer: true,
    timeout: 120000
  }
});
