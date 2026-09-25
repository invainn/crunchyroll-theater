import { defineConfig } from "@playwright/test";
import type { WorkerOptions } from "./tests/harness";

export default defineConfig<{}, WorkerOptions>({
  // Each test launches its own Chromium with the extension loaded.
  fullyParallel: true,
  // Each worker is a full Chromium; keep local runs light on CPU and memory.
  workers: process.env.CI ? undefined : 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    trace: "retain-on-failure",
  },
  projects: [
    {
      // Deterministic: crunchyroll.com is served from tests/fixture/pages.
      name: "fixture",
      testDir: "tests/fixture",
      use: { mockSite: true, profile: "fresh" },
    },
    {
      // Real site with the Premium profile saved by `pnpm test:login`.
      // Local only. A single worker: Chromium locks a profile to one process.
      name: "live",
      testDir: "tests/live",
      timeout: 90_000,
      fullyParallel: false,
      workers: 1,
      use: { mockSite: false, profile: "authed" },
    },
    {
      // `pnpm test:login`: interactive, run on its own.
      name: "login",
      testDir: "tests/login",
    },
  ],
});
