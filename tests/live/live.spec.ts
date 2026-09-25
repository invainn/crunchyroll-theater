import { test, expect } from "../harness";
import type { Page } from "@playwright/test";

/**
 * Runs against the real www.crunchyroll.com with a logged-in Premium account
 * (Crunchyroll has no free tier since 2026, so that is the only way anyone
 * watches). Local only: see tests/README.md. Override the episode with
 * LIVE_WATCH_URL if it is unavailable in your region.
 */
const WATCH_URL =
  process.env.LIVE_WATCH_URL ??
  "https://www.crunchyroll.com/watch/G14U4DMM3/first-contact";

const header = (page: Page) => page.locator(".erc-large-header");
const headerContent = (page: Page) => page.locator(".header-content");
const videoWrapper = (page: Page) => page.locator(".video-player-wrapper");

const playerFrame = (page: Page) =>
  page.locator('iframe[src*="static.crunchyroll.com"]');

async function gotoWatch(page: Page) {
  await page.goto(WATCH_URL);
  await expect(videoWrapper(page)).toBeAttached({ timeout: 30_000 });

  const blocked = page.locator(".erc-blocked-stream");
  await expect(playerFrame(page).or(blocked).first()).toBeAttached({
    timeout: 30_000,
  });
  expect(
    await blocked.count(),
    "Episode is paywalled: the saved profile needs a Premium account " +
      "(re-run `pnpm test:login`), or set LIVE_WATCH_URL to a playable episode.",
  ).toBe(0);
}

/** Click a link through the site's own router (the link may be offscreen). */
async function clickLink(page: Page, selector: string) {
  const link = page.locator(selector).first();
  const href = await link.getAttribute("href");
  await link.dispatchEvent("click");
  return href!;
}

test.skip(
  !process.env.CT_LIVE,
  "Hits the real site; run via `pnpm test:live`.",
);

test.beforeEach(async ({ page, ext }) => {
  // The profile persists between runs; start every test from defaults.
  await ext.clearStorage();
  await page.goto("https://www.crunchyroll.com/account/membership");
  await expect(
    page,
    "Saved profile is logged out. Re-run `pnpm test:login`.",
  ).not.toHaveURL(/\/login|sso\.crunchyroll\.com/, { timeout: 20_000 });
});

test("the elements the extension targets still exist", async ({ page }) => {
  await gotoWatch(page);
  await expect(header(page)).toBeAttached();
  await expect(headerContent(page)).toBeAttached();
  await expect(page.locator(".erc-watch-episode-layout")).toBeAttached();
});

test("theater mode applies on a watch page", async ({ page }) => {
  await gotoWatch(page);
  await expect(header(page)).toHaveClass(/\bct-header\b/);
  await expect(videoWrapper(page)).toHaveClass(/\bct-specify\b/);
  await expect(videoWrapper(page)).toHaveClass(/\bct-video-wrapper-spacing\b/);
});

test("hide header toggle works on the real page", async ({ page, ext }) => {
  await ext.setStorage({ hideHeader: false });
  await gotoWatch(page);
  await expect(videoWrapper(page)).toHaveClass(/\bct-specify\b/);

  await ext.sendToPage(page, "toggle_header");
  await expect(headerContent(page)).toHaveClass(/\bct-hide-header\b/);
  await expect(header(page)).toHaveClass(/\bct-header-theater\b/);
  await expect(videoWrapper(page)).toHaveClass(/\bct-video-wrapper\b/);
  await expect(headerContent(page)).toBeHidden();

  await ext.sendToPage(page, "toggle_header");
  await expect(headerContent(page)).not.toHaveClass(/\bct-hide-header\b/);
  await expect(headerContent(page)).toBeVisible();
});

test("next episode keeps theater mode", async ({ page, ext }) => {
  await ext.setStorage({ hideHeader: true });
  await gotoWatch(page);
  await expect(videoWrapper(page)).toHaveClass(/\bct-video-wrapper\b/);

  const current = new URL(WATCH_URL).pathname.split("/")[2];
  const href = await clickLink(
    page,
    `a[href^="/watch/"]:not([href*="${current}"])`,
  );
  await expect(page).toHaveURL(new RegExp(href.split("/")[2]));

  await expect(videoWrapper(page)).toHaveClass(/\bct-video-wrapper\b/);
  await expect(headerContent(page)).toHaveClass(/\bct-hide-header\b/);
});

test("watch -> series resets, and back re-applies", async ({ page, ext }) => {
  await ext.setStorage({ hideHeader: true });
  await gotoWatch(page);
  await expect(headerContent(page)).toHaveClass(/\bct-hide-header\b/);

  await clickLink(page, 'a[href*="/series/"]');
  await expect(page).toHaveURL(/\/series\//);
  await expect(videoWrapper(page)).toHaveCount(0, { timeout: 30_000 });
  await expect(headerContent(page)).not.toHaveClass(/\bct-hide-header\b/);
  await expect(header(page)).not.toHaveClass(/\bct-header-theater\b/);

  await page.goBack();
  await expect(videoWrapper(page)).toBeAttached({ timeout: 30_000 });
  await expect(headerContent(page)).toHaveClass(/\bct-hide-header\b/);
});

test("player iframe gets theater sizing", async ({ page }) => {
  await gotoWatch(page);
  const root = page
    .frameLocator('iframe[src*="static.crunchyroll.com"]')
    .locator("#vilosRoot");
  await expect(root).toHaveClass(/\bct-player-container\b/, {
    timeout: 45_000,
  });
});
