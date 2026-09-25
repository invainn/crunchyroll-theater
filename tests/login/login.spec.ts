import fs from "node:fs";
import { test } from "@playwright/test";
import { AUTHED_PROFILE_DIR, launchWithExtension } from "../harness";

/**
 * `pnpm test:login`: opens a visible Chromium with the test profile so you
 * can sign in to Crunchyroll by hand. Close the window when done; the
 * `live` project reuses this profile headlessly.
 */
test("log in to Crunchyroll", async () => {
  test.skip(!process.env.CT_LOGIN, "Interactive; run via `pnpm test:login`.");
  test.setTimeout(0);
  fs.mkdirSync(AUTHED_PROFILE_DIR, { recursive: true });
  const context = await launchWithExtension(AUTHED_PROFILE_DIR, {
    headless: false,
    stealth: true,
  });
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto("https://www.crunchyroll.com/login");
  await context.waitForEvent("close", { timeout: 0 });
});
