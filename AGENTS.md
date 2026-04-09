# Agent Guidelines

## Project

Chrome Extension (Manifest V3) that provides theater mode for Crunchyroll's video player. TypeScript compiled via Rollup. No test suite — build success is the verification step.

## Package Manager

Use **pnpm** exclusively. Do not use npm or yarn.

```bash
pnpm install       # install dependencies
pnpm build         # compile TypeScript + SCSS
pnpm format        # run prettier
```

## Build Verification

Always run `pnpm build` after making changes. A clean build with no TypeScript errors is required before committing.

## Git

Commits must be signed. Signing is configured via SSH key — do not change `gpg.format`, `user.signingkey`, or `commit.gpgsign` in the repo config.

Use `git commit -S` explicitly if amending or cherry-picking.

## Architecture

- `src/js/content.ts` — main content script; sets up `MutationObserverHandler` and handles Chrome messages
- `src/js/background.ts` — service worker; forwards keyboard commands and navigation events to the content script
- `src/js/player.ts` — content script injected into the Crunchyroll player iframe
- `src/js/popup.ts` — extension popup UI
- `src/js/actions/` — individual DOM actions (header, video wrapper, player container, scrollbar)
- `src/js/navigation-handler.ts` — detects watch page vs. non-watch page and applies/removes theater mode
- `src/js/mutation-handler.ts` — `MutationObserver` wrapper; fires actions only when nodes are added to the DOM

## Key Conventions

- DOM elements are queried directly with `document.getElementsByClassName` / `getElementById` — there is no caching layer
- Actions implement the `ElementAction` interface (`initialized: boolean`, `execute(): void`)
- Each action sets `this.initialized = true` once its target element is found, so it only fires once per page load
- Navigation resets are triggered by `CLEAR_ELEMENT_STATE_MESSAGE` from the background script on SPA navigation events
- CSS class names applied by the extension are prefixed with `ct-` (e.g. `ct-header`, `ct-hide-header`)
- DOM class name constants live in `src/js/utils/constants.ts` — use them, never hardcode strings
