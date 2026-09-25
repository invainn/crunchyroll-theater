import { test, expect } from "../harness";
import type { Page } from "@playwright/test";

const WATCH_EP1 = "https://www.crunchyroll.com/watch/EP1/episode-one";
const HOME = "https://www.crunchyroll.com/";

const header = (page: Page) => page.locator(".erc-large-header");
const headerContent = (page: Page) => page.locator(".header-content");
const videoWrapper = (page: Page) => page.locator(".video-player-wrapper");
const scrollbarStyle = (page: Page) => page.locator("style#remove-scrollbar");

/** SPA navigation via the fixture's pushState router, like a user click. */
async function navigate(page: Page, href: string) {
  // dispatchEvent: the links live in the header, which may be hidden.
  await page.locator(`a[href="${href}"]`).first().dispatchEvent("click");
  await expect(page).toHaveURL(new RegExp(`${href}$`));
}

async function expectTheaterHeaderHidden(page: Page) {
  await expect(header(page)).toHaveClass(/\bct-header-theater\b/);
  await expect(headerContent(page)).toHaveClass(/\bct-hide-header\b/);
  await expect(videoWrapper(page)).toHaveClass(/\bct-video-wrapper\b/);
}

async function expectTheaterHeaderShown(page: Page) {
  await expect(header(page)).not.toHaveClass(/\bct-header-theater\b/);
  await expect(headerContent(page)).not.toHaveClass(/\bct-hide-header\b/);
  await expect(videoWrapper(page)).toHaveClass(/\bct-video-wrapper-spacing\b/);
}

test.describe("initial page load", () => {
  test("fresh profile: theater mode applies with header shown and scrollbar kept", async ({
    page,
    ext,
  }) => {
    await page.goto(WATCH_EP1);

    await expect(header(page)).toHaveClass(/\bct-header\b/);
    await expect(videoWrapper(page)).toHaveClass(/\bct-specify\b/);
    await expectTheaterHeaderShown(page);
    await expect(scrollbarStyle(page)).toHaveCount(0);

    expect(await ext.getStorage("hideHeader")).toBeUndefined();
    expect(await ext.getStorage("removeScrollbar")).toBeUndefined();
  });

  test("saved settings are applied on load", async ({ page, ext }) => {
    await ext.setStorage({ hideHeader: true, removeScrollbar: true });
    await page.goto(WATCH_EP1);

    await expectTheaterHeaderHidden(page);
    await expect(scrollbarStyle(page)).toHaveCount(1);
  });

  test("non-watch page is left alone", async ({ page, ext }) => {
    await ext.setStorage({ hideHeader: true });
    await page.goto(HOME);
    await expect(page.locator(".erc-browse")).toBeVisible();

    await expect(header(page)).not.toHaveClass(/\bct-header-theater\b/);
    await expect(headerContent(page)).not.toHaveClass(/\bct-hide-header\b/);
  });

  test("player iframe gets theater sizing", async ({ page }) => {
    await page.goto(WATCH_EP1);
    const player = page.frameLocator("iframe.video-player");
    const root = player.locator("#vilosRoot");

    await expect(root).toHaveClass(/\bct-player-container\b/);
    const [rootHeight, frameHeight] = await root.evaluate((el) => [
      el.getBoundingClientRect().height,
      window.innerHeight,
    ]);
    expect(rootHeight).toBe(frameHeight);
  });
});

test.describe("hidden header hover", () => {
  test("hovering the header reveals it, leaving hides it again", async ({
    page,
    ext,
  }) => {
    await ext.setStorage({ hideHeader: true });
    await page.goto(WATCH_EP1);
    await expectTheaterHeaderHidden(page);

    const box = (await header(page).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(headerContent(page)).not.toHaveClass(/\bct-hide-header\b/);

    await page.mouse.move(box.x + box.width / 2, box.y + box.height + 300);
    await expect(headerContent(page)).toHaveClass(/\bct-hide-header\b/);
  });
  test("enter and leave in the same frame leaves the header hidden", async ({
    page,
    ext,
  }) => {
    await ext.setStorage({ hideHeader: true });
    await page.goto(WATCH_EP1);
    await expectTheaterHeaderHidden(page);

    // A quick flick across the header: both events before the next frame.
    await header(page).evaluate((el) => {
      el.dispatchEvent(new MouseEvent("mouseenter"));
      el.dispatchEvent(new MouseEvent("mouseleave"));
    });
    await page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        ),
    );
    await expect(headerContent(page)).toHaveClass(/\bct-hide-header\b/);
  });
});

test.describe("SPA navigation", () => {
  test("episode to episode keeps theater mode", async ({ page, ext }) => {
    await ext.setStorage({ hideHeader: true });
    await page.goto(WATCH_EP1);
    await expectTheaterHeaderHidden(page);

    await videoWrapper(page).evaluate((el) =>
      el.setAttribute("data-original", ""),
    );
    await navigate(page, "/watch/EP2/episode-two");
    await expect(page.locator(".title")).toHaveText("EP2");

    await expect(videoWrapper(page)).toHaveAttribute("data-original", "");
    await expectTheaterHeaderHidden(page);
  });

  test("watch -> series resets, series -> watch re-applies", async ({
    page,
    ext,
  }) => {
    await ext.setStorage({ hideHeader: true });
    await page.goto(WATCH_EP1);
    await expectTheaterHeaderHidden(page);

    await navigate(page, "/series/SERIES1/fixture-series");
    await expect(page.locator(".erc-series-hero")).toBeVisible();
    await expect(header(page)).not.toHaveClass(/\bct-header-theater\b/);
    await expect(headerContent(page)).not.toHaveClass(/\bct-hide-header\b/);

    await navigate(page, "/watch/EP2/episode-two");
    await expectTheaterHeaderHidden(page);
  });

  test("navigation reset is sent to the navigating tab, not the active one", async ({
    context,
    page,
    serviceWorker,
  }) => {
    await page.goto(WATCH_EP1);
    await expect(videoWrapper(page)).toHaveClass(/\bct-specify\b/);

    // Another Crunchyroll tab is focused while the first one navigates.
    const other = await context.newPage();
    await other.goto(HOME);
    await other.bringToFront();

    const [pageTabId, otherTabId] = await serviceWorker.evaluate(
      async (urls) => {
        const tabs = await chrome.tabs.query({});
        return urls.map((u) => tabs.find((t) => t.url === u)!.id!);
      },
      [page.url(), other.url()],
    );

    // Record what the background script sends.
    await serviceWorker.evaluate(() => {
      const g = globalThis as unknown as { sent: [number, unknown][] };
      g.sent = [];
      const real = chrome.tabs.sendMessage.bind(chrome.tabs);
      chrome.tabs.sendMessage = (tabId: number, msg: unknown) => {
        g.sent.push([tabId, msg]);
        return real(tabId, msg);
      };
    });

    await navigate(page, "/series/SERIES1/fixture-series");

    const sent = () =>
      serviceWorker.evaluate(
        () => (globalThis as unknown as { sent: [number, unknown][] }).sent,
      );
    await expect
      .poll(sent)
      .toContainEqual([pageTabId, { msg: "clear_element_state" }]);
    expect(await sent()).not.toContainEqual([
      otherTabId,
      { msg: "clear_element_state" },
    ]);
  });
});

test.describe("toggle messages (keyboard commands)", () => {
  test("commands are registered with the expected shortcuts", async ({
    serviceWorker,
  }) => {
    const commands = await serviceWorker.evaluate(() =>
      chrome.commands.getAll(),
    );
    const byName = Object.fromEntries(commands.map((c) => [c.name, c]));
    expect(byName.toggle_header?.shortcut).toBe("Ctrl+Comma");
    expect(byName.toggle_scrollbar?.shortcut).toBe("Ctrl+Period");
  });

  test("toggle header on a watch page flips DOM and storage", async ({
    page,
    ext,
  }) => {
    await page.goto(WATCH_EP1);
    await expectTheaterHeaderShown(page);

    await ext.sendToPage(page, "toggle_header");
    await expectTheaterHeaderHidden(page);
    await expect.poll(() => ext.getStorage("hideHeader")).toBe(true);

    await ext.sendToPage(page, "toggle_header");
    await expectTheaterHeaderShown(page);
    await expect.poll(() => ext.getStorage("hideHeader")).toBe(false);
  });

  test("toggle header off a watch page still saves the setting", async ({
    page,
    ext,
  }) => {
    await page.goto(HOME);
    await expect(page.locator(".erc-browse")).toBeVisible();

    await ext.sendToPage(page, "toggle_header");
    await expect.poll(() => ext.getStorage("hideHeader")).toBe(true);
    await expect(headerContent(page)).not.toHaveClass(/\bct-hide-header\b/);

    await navigate(page, "/watch/EP1/episode-one");
    await expectTheaterHeaderHidden(page);
  });

  test("toggle scrollbar flips the style and survives reload", async ({
    page,
    ext,
  }) => {
    await page.goto(WATCH_EP1);
    await expect(videoWrapper(page)).toHaveClass(/\bct-specify\b/);

    await ext.sendToPage(page, "toggle_scrollbar");
    await expect(scrollbarStyle(page)).toHaveCount(1);
    await expect.poll(() => ext.getStorage("removeScrollbar")).toBe(true);

    await page.reload();
    await expect(scrollbarStyle(page)).toHaveCount(1);

    await ext.sendToPage(page, "toggle_scrollbar");
    await expect(scrollbarStyle(page)).toHaveCount(0);
    await expect.poll(() => ext.getStorage("removeScrollbar")).toBe(false);
  });

  test("hide header setting survives reload", async ({ page, ext }) => {
    await page.goto(WATCH_EP1);
    await ext.sendToPage(page, "toggle_header");
    await expectTheaterHeaderHidden(page);

    await page.reload();
    await expectTheaterHeaderHidden(page);
  });
});

test.describe("popup", () => {
  test("switches reflect storage and toggle the page", async ({
    page,
    ext,
  }) => {
    await ext.setStorage({ hideHeader: false, removeScrollbar: true });
    await page.goto(WATCH_EP1);
    await expectTheaterHeaderShown(page);

    const popup = await ext.openPopup(page);
    const hideHeader = popup.locator("#hide-header-switch");
    const scrollbar = popup.locator("#scrollbar-switch");
    await expect(hideHeader).not.toBeChecked();
    await expect(scrollbar).toBeChecked();

    await hideHeader.click();
    await expectTheaterHeaderHidden(page);
    await expect.poll(() => ext.getStorage("hideHeader")).toBe(true);

    await scrollbar.click();
    await expect(scrollbarStyle(page)).toHaveCount(0);
    await expect.poll(() => ext.getStorage("removeScrollbar")).toBe(false);
  });

  test("shows a message when not on Crunchyroll", async ({ ext }) => {
    const popup = await ext.openPopup(null);
    await expect(popup.locator("#not-on-page")).toBeVisible();
    await expect(popup.locator("#switches")).toBeHidden();
  });
});
