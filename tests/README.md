# Tests

Playwright loads the unpacked extension from `public/` into Chromium and
drives it headlessly. Every test gets its own browser and a throwaway profile.

| Command            | Project(s)                   | Hits the real site | Runs in CI |
| ------------------ | ---------------------------- | ------------------ | ---------- |
| `pnpm test`        | `fixture`                    | no                 | yes        |
| `pnpm test:live`   | `live` (Premium account)     | yes                | no         |
| `pnpm test:login`  | `login` (opens a window)     | yes                | no         |

`pnpm test:typecheck` type-checks the test code.

## Fixture tests (`tests/fixture`)

`https://www.crunchyroll.com/**` and `https://static.crunchyroll.com/**` are
intercepted with `context.route()` and answered with `tests/fixture/pages`, so
the extension's content scripts, host checks and `webNavigation` events all
behave as on the real site. `app.html` is a tiny pushState router that mirrors
the live DOM (header, watch layout, video wrapper, player iframe). If
Crunchyroll changes its markup, update these pages to match.

## Live tests (`tests/live`)

Run the same flows against the real site with a saved, logged-in **Premium**
profile. Crunchyroll dropped its free tier at the end of 2025, so no episode
plays without a subscription; the tests fail with a clear message if the
account hits the paywall. They run one at a time to keep traffic low.
`LIVE_WATCH_URL` overrides the episode used.

To set up, run `pnpm test:login`, sign in in the window that opens, then close
it. The profile is stored in `.auth/` (gitignored).

## Browser

Tests use `CHROMIUM_PATH` if set, else Playwright's bundled Chromium
(`pnpm exec playwright install chromium`), else a system Chromium. Branded
Google Chrome can't be used: it ignores `--load-extension` since Chrome 137.
For DRM playback, a Widevine CDM is copied from `~/.config/chromium/WidevineCdm`
(or `WIDEVINE_DIR`) into the test profile. `HEADED=1` shows the browser.

## Not covered

- Real keyboard shortcuts: `chrome.commands` are handled by the browser, so
  tests check the registered shortcuts and send the same message the
  background script sends.
- The popup is opened as a tab with `chrome.tabs.query` pointed at the page
  under test, since a tab-opened popup would otherwise see itself as active.
