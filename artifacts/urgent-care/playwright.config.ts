import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.E2E_PORT || "3001";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${PORT}`;

// Prefer an explicit env override (useful in CI), then fall back to the
// nix-provided Chromium that ships with this Replit environment.  If neither
// is found, leave executablePath undefined so Playwright uses its own
// managed browser (requires `playwright install chromium` to have been run).
const CHROMIUM_PATH =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  "/nix/store/0n9rl5l9syy808xi9bk4f6dhnfrvhkww-playwright-browsers-chromium/chromium-1080/chrome-linux/chrome";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath: CHROMIUM_PATH,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
      },
    },
  ],
  webServer: {
    command: `PORT=${PORT} pnpm dev`,
    url: `${BASE_URL}/urgent-care`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
