# Playwright Browser Automation Tests Design

**Date:** 2026-04-09
**Approach:** A — Single config, environment flag

## Overview

Add a Playwright test suite that verifies the extension's core behaviors. Tests run against a local mock page in CI and against a real Crunchyroll watch page locally. A GitHub Actions workflow registers a required check on PRs to `main`.

---

## Section 1: Test Infrastructure

### New dependencies (devDependencies)

- `@playwright/test` — test runner and browser automation
- `serve` — lightweight static file server for CI mock pages

### New files

| Path | Purpose |
|------|---------|
| `playwright.config.ts` | Playwright config; switches `baseURL` on `CI` env var |
| `test/fixtures/watch-page.html` | Mock page with Crunchyroll watch page DOM structure |
| `test/fixtures/non-watch-page.html` | Mock page without `video-player-wrapper` (simulates browse/home page) |
| `manifest.test.json` | Copy of manifest with `http://localhost/*` added to permissions |
| `.env.example` | Documents `TEST_URL` variable for local runs |
| `.github/workflows/test.yml` | CI workflow |
| `test/extension.spec.ts` | All 5 test cases |

### New scripts in `package.json`

```json
"test": "pnpm build && playwright test",
"test:ci": "pnpm build && playwright test --project=ci"
```

### Config switching

`playwright.config.ts` reads `process.env.CI`:

- **CI** (`CI=true`): `baseURL = 'http://localhost:4000'`, static server serves `test/fixtures/`
- **Local** (`CI` unset): `baseURL` read from `TEST_URL` in `.env`

The extension is loaded via `chromium.launchPersistentContext` with:
- `--load-extension=./public`
- `--disable-extensions-except=./public`

In CI, `manifest.test.json` is copied over `public/manifest.json` before the test run to add `localhost` to `host_permissions` and `content_scripts[0].matches`.

---

## Section 2: Mock Pages and Test Manifest

### `test/fixtures/watch-page.html`

Replicates the DOM structure the extension targets on a Crunchyroll watch page. No styling or real content — only the class names the extension looks for.

```html
<!doctype html>
<html>
  <body>
    <div class="erc-large-header">
      <div class="header-content"></div>
    </div>
    <div class="erc-watch-episode">
      <div class="erc-watch-episode-layout">
        <div class="video-player-wrapper"></div>
      </div>
    </div>
  </body>
</html>
```

### `test/fixtures/non-watch-page.html`

Simulates a browse/home page — header present but no `video-player-wrapper`.

```html
<!doctype html>
<html>
  <body>
    <div class="erc-large-header">
      <div class="header-content"></div>
    </div>
  </body>
</html>
```

### `manifest.test.json`

Copy of `public/manifest.json` with two additions:

- `"http://localhost/*"` added to `host_permissions`
- `"http://localhost/*"` added to `content_scripts[0].matches`

The player iframe content script (`static.crunchyroll.com`) is unchanged — the `vilosRoot` element lives in a cross-origin iframe and is out of scope for this test suite.

---

## Section 3: Test Cases (`test/extension.spec.ts`)

All tests share a `beforeEach` that navigates to the appropriate fixture page and waits for the extension's `MutationObserver` to run.

### a) Theater mode activates on a watch page

Navigate to `watch-page.html`. Assert:
- `erc-large-header` has class `ct-header`
- `video-player-wrapper` has class `ct-specify`

### b) Theater mode deactivates when navigating away

Navigate to `watch-page.html`, wait for theater mode to apply, navigate to `non-watch-page.html`. Assert:
- `header-content` does not have class `ct-hide-header`
- `erc-large-header` does not have class `ct-header-theater`

### c) Popup switches toggle header and scrollbar

Open the extension popup via its `chrome-extension://` URL. Click the "Hide Header" switch. Navigate to `watch-page.html`. Assert:
- `header-content` has class `ct-hide-header`

Click the "Remove Scrollbar" switch. Assert:
- `#remove-scrollbar` style element exists in `document.body`

### d) Keyboard shortcuts toggle header

Navigate to `watch-page.html` with theater mode active (header visible, hide-header off). Press `Control+Comma`. Assert `header-content` gains `ct-hide-header`. Press `Control+Comma` again. Assert `ct-hide-header` is removed.

### e) Settings persist across page reload

Enable "Hide Header" via popup switch. Reload the page. Assert `header-content` still has `ct-hide-header` — the extension re-read from Chrome storage and re-applied on load.

---

## Section 4: GitHub Actions Workflow (`.github/workflows/test.yml`)

```yaml
name: Playwright Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  playwright:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: npx playwright install chromium --with-deps
      - run: cp manifest.test.json public/manifest.json
      - run: npx serve test/fixtures -p 4000 &
      - run: pnpm test:ci
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

The job is named `playwright`. After this workflow merges to `main`, add it as a required status check under **Settings → Branches → main → Require status checks → `playwright`**.

---

## Out of Scope

- Testing the player iframe (`vilosRoot` / `static.crunchyroll.com`) — cross-origin iframe, not reachable via content script in tests
- Visual regression testing
- Testing on real Crunchyroll in CI (Cloudflare bot detection risk)
