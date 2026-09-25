import {
  test as base,
  chromium,
  type BrowserContext,
  type Page,
  type Worker,
} from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const EXTENSION_DIR = path.join(ROOT, "public");
const FIXTURE_PAGES = path.join(__dirname, "fixture", "pages");
export const AUTHED_PROFILE_DIR = path.join(ROOT, ".auth", "chromium-profile");

const SYSTEM_CHROMIUM_PATHS = [
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
];

/**
 * Prefer CHROMIUM_PATH, then Playwright's bundled Chromium if it has been
 * downloaded, then a system Chromium. Branded Google Chrome is not usable:
 * since Chrome 137 it ignores --load-extension.
 */
export function resolveChromium(): string | undefined {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  if (fs.existsSync(chromium.executablePath())) return undefined;
  return SYSTEM_CHROMIUM_PATHS.find((p) => fs.existsSync(p));
}

/**
 * Copies an already-downloaded Widevine CDM so DRM playback can work.
 * Best effort: the source belongs to the user's own Chromium, which may be
 * updating it, and playback is only needed by one live test.
 */
function seedWidevine(userDataDir: string): void {
  const target = path.join(userDataDir, "WidevineCdm");
  if (fs.existsSync(target)) return;
  const source = [
    process.env.WIDEVINE_DIR,
    path.join(os.homedir(), ".config", "chromium", "WidevineCdm"),
  ].find((p): p is string => !!p && fs.existsSync(p));
  if (!source) return;
  try {
    fs.cpSync(source, target, { recursive: true });
  } catch (error) {
    fs.rmSync(target, { recursive: true, force: true });
    console.warn(`Could not copy Widevine CDM from ${source}: ${error}`);
  }
}

/**
 * A regular desktop Chrome user agent for the installed Chromium version
 * (headless Chromium otherwise reports itself as "HeadlessChrome").
 */
function desktopUserAgent(executablePath: string): string {
  const version =
    execFileSync(executablePath, ["--version"], { encoding: "utf8" }).match(
      /\d+\.\d+\.\d+\.\d+/,
    )?.[0] ?? "140.0.0.0";
  const platform =
    process.platform === "darwin"
      ? "Macintosh; Intel Mac OS X 10_15_7"
      : "X11; Linux x86_64";
  return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`;
}

export type LaunchOptions = {
  headless: boolean;
  /**
   * Hide the automation markers (--enable-automation, navigator.webdriver,
   * the HeadlessChrome user agent) that make Cloudflare challenge every
   * request on the real site. Only used for the live and login projects.
   */
  stealth?: boolean;
};

export async function launchWithExtension(
  userDataDir: string,
  { headless, stealth = false }: LaunchOptions,
): Promise<BrowserContext> {
  // Playback only matters on the real site.
  if (stealth) seedWidevine(userDataDir);
  const executablePath = resolveChromium();
  const args = [
    `--disable-extensions-except=${EXTENSION_DIR}`,
    `--load-extension=${EXTENSION_DIR}`,
  ];
  if (stealth) args.push("--disable-blink-features=AutomationControlled");

  return chromium.launchPersistentContext(userDataDir, {
    headless,
    executablePath,
    // The bundled build needs the "chromium" channel to run extensions headless.
    channel: executablePath ? undefined : "chromium",
    viewport: { width: 1280, height: 800 },
    args,
    ignoreDefaultArgs: stealth ? ["--enable-automation"] : undefined,
    userAgent: stealth
      ? desktopUserAgent(executablePath ?? chromium.executablePath())
      : undefined,
  });
}

export type Profile = "fresh" | "authed";

export type WorkerOptions = {
  /** "fresh" = throwaway profile per test; "authed" = saved logged-in profile. */
  profile: Profile;
  /** Serve tests/fixture/pages for crunchyroll.com instead of the real site. */
  mockSite: boolean;
};

type Fixtures = {
  context: BrowserContext;
  serviceWorker: Worker;
  extensionId: string;
  ext: ExtensionHelpers;
};

export const test = base.extend<Fixtures, WorkerOptions>({
  profile: ["fresh", { option: true, scope: "worker" }],
  mockSite: [true, { option: true, scope: "worker" }],

  context: async ({ profile, mockSite }, use, testInfo) => {
    let userDataDir: string;
    if (profile === "authed") {
      if (!fs.existsSync(AUTHED_PROFILE_DIR)) {
        testInfo.skip(
          true,
          "No logged-in profile. Run `pnpm test:login` first.",
        );
      }
      userDataDir = AUTHED_PROFILE_DIR;
    } else {
      userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "ct-profile-"));
    }

    const context = await launchWithExtension(userDataDir, {
      headless: !process.env.HEADED,
      stealth: !mockSite,
    });

    if (mockSite) {
      await context.route("https://www.crunchyroll.com/**", (route) =>
        route.fulfill({ path: path.join(FIXTURE_PAGES, "app.html") }),
      );
      await context.route("https://static.crunchyroll.com/**", (route) =>
        route.fulfill({ path: path.join(FIXTURE_PAGES, "player.html") }),
      );
    }

    await use(context);
    await context.close();
    if (profile === "fresh") {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  },

  serviceWorker: async ({ context }, use) => {
    const worker =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent("serviceworker"));
    await use(worker);
  },

  extensionId: async ({ serviceWorker }, use) => {
    await use(new URL(serviceWorker.url()).host);
  },

  ext: async ({ serviceWorker, context, extensionId }, use) => {
    await use(new ExtensionHelpers(serviceWorker, context, extensionId));
  },
});

export const expect = test.expect;

type StorageValue = string | boolean | undefined;

export class ExtensionHelpers {
  constructor(
    private readonly worker: Worker,
    private readonly context: BrowserContext,
    readonly id: string,
  ) {}

  getStorage(key: string): Promise<StorageValue> {
    return this.worker.evaluate(
      async (k) => (await chrome.storage.sync.get(k))[k],
      key,
    );
  }

  async clearStorage(): Promise<void> {
    await this.worker.evaluate(() => chrome.storage.sync.clear());
  }

  async setStorage(values: Record<string, StorageValue>): Promise<void> {
    await this.worker.evaluate((v) => chrome.storage.sync.set(v), values);
  }

  private tabIdFor(page: Page): Promise<number> {
    return this.worker.evaluate(async (url) => {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find((t) => t.url === url);
      if (!tab?.id) throw new Error(`no tab for ${url}`);
      return tab.id;
    }, page.url());
  }

  /**
   * Delivers a message to the page's content script exactly as the background
   * script does for keyboard commands (chrome.commands are handled by the
   * browser, so Playwright key presses cannot trigger them).
   */
  async sendToPage(page: Page, msg: string): Promise<void> {
    const tabId = await this.tabIdFor(page);
    await this.worker.evaluate(
      ({ tabId, msg }) => chrome.tabs.sendMessage(tabId, { msg }),
      { tabId, msg },
    );
  }

  /**
   * Opens the popup in a tab. Because a popup opened this way is itself the
   * active tab, chrome.tabs.query is pointed at `target` (or at nothing).
   */
  async openPopup(target: Page | null): Promise<Page> {
    const popup = await this.context.newPage();
    const targetUrl = target?.url() ?? null;
    await popup.addInitScript((url) => {
      const realQuery = chrome.tabs.query.bind(chrome.tabs);
      // @ts-expect-error overriding the callback overload used by popup.ts
      chrome.tabs.query = (
        _info: unknown,
        cb: (tabs: chrome.tabs.Tab[]) => void,
      ) =>
        realQuery({}, (tabs) =>
          cb(url ? tabs.filter((t) => t.url === url) : []),
        );
    }, targetUrl);
    await popup.goto(`chrome-extension://${this.id}/html/popup.html`);
    return popup;
  }
}
