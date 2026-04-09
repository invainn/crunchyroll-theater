# Crunchyroll Theater — Improvements Design

**Date:** 2026-04-09  
**Approach:** B — Bug fixes + targeted refactor

## Overview

Fix real bugs, remove the fragile `ElementState` DOM cache, repair `VideoWrapperAction` initialization, and narrow the `MutationObserver` to reduce unnecessary work. All existing functionality is preserved.

---

## Section 1: Bug Fixes

| File | Issue | Fix |
|------|-------|-----|
| `public/css/content.css` | `display: absolute` — invalid CSS | `position: absolute` |
| `src/js/popup.ts` | `console.log(setting as boolean)` debug leftover | remove |
| `src/js/content.ts` | `!hideHeader as boolean` — casts before negating | `!(hideHeader as boolean)` |
| `src/js/utils/chrome-storage.ts` | `if (!keys)` — objects are always truthy, default never fires | `if (keys[key] === undefined)` |
| `src/js/navigation-handler.ts` | hardcoded `"hideHeader"` string | use `HIDE_HEADER_STORAGE_KEY` constant |
| `public/html/popup.html` | title is `"Bootstrap demo"` | `"Crunchyroll Theater"` |
| `public/css/player.css` | `margin-top: -60.984px` magic number, inconsistent with `content.css` | `-3.75rem` |
| `src/js/actions/scrollbar-action.ts` | `-webkit-scrollbar` only, no Firefox support | add `scrollbar-width: none` to `html` and `body` |

---

## Section 2: Remove `ElementState`

### Problem
`ElementState` is a cache around DOM lookups. On SPA navigation, Crunchyroll tears down and remounts elements — leaving the cache holding stale references. The current workaround is a `CLEAR_ELEMENT_STATE_MESSAGE` that manually invalidates the cache on every navigation event. The workaround exists because of the cache.

The author flagged this: `// TODO: probably scrap all of this`.

### Fix
- Delete `src/js/element-state.ts`
- Replace all `elementState.fetchStateByClassName(X)` / `fetchStateById(X)` calls with direct `document.querySelector` / `getElementById` calls at the point of use
- `CLEAR_ELEMENT_STATE_MESSAGE` is retained — it still resets `initializedVideoPage` state on navigation — but no longer recreates an `ElementState` object

### Interface simplification
The `ElementAction` interface and all action classes currently accept `elementState: ElementState` as a parameter and pass it through the call chain. With `ElementState` removed, this parameter is dropped everywhere:

```ts
// Before
interface ElementAction {
  initialized: boolean;
  canExecuteAction?(elementState: ElementState): boolean;
  execute(elementState: ElementState): void;
}

// After
interface ElementAction {
  initialized: boolean;
  execute(): void;
}
```

Static helper methods (`HeaderAction.toggleHeader`, `VideoWrapperAction.toggleVideoPlayerSpacing`, etc.) lose the `elementState` parameter and query the DOM directly.

`MutationObserverHandler` drops the `elementState` field and stops passing it to actions.

---

## Section 3: Fix `VideoWrapperAction` Initialization

### Problem
`VideoWrapperAction.execute()` never sets `this.initialized = true`. It fires on every DOM mutation for the lifetime of the page, making an async `ChromeStorage.fetchStorageValue` call each time. The author acknowledged this: `// TODO: super sloppy`.

The original concern: the element might not exist yet on the first call, so we can't initialize unconditionally.

### Fix
Check element existence before setting initialized:

```ts
execute(): void {
  if (this.initialized || !this.canExecuteAction()) return;
  this.initialized = true;
  VideoWrapperAction.toggleVideoPlayerSpacing(...);
}
```

Once the element is found and classes are applied, `initialized = true` prevents re-firing. Navigation resets are handled by `CLEAR_ELEMENT_STATE_MESSAGE` which recreates the `MutationObserverHandler` (and thus a fresh `VideoWrapperAction` with `initialized = false`).

---

## Section 4: Narrow `MutationObserver`

### Problem
The observer watches the entire `document.body` subtree and fires the full action loop on every DOM change — attribute changes, text updates, ad loading, subtitle rendering, etc. Only cases where new nodes are added to the DOM are relevant (SPA navigation mounting new content).

### Fix
Filter mutations before running actions:

```ts
observerCallback(mutations: MutationRecord[]) {
  const hasAddedNodes = mutations.some(m => m.addedNodes.length > 0);
  if (!hasAddedNodes) return;

  this.actions.forEach(action => action.execute());
  NavigationHandler.handle();
}
```

No behavior change for navigation/page-load cases. Skips the majority of irrelevant mutations.

---

## Files Changed

| File | Change |
|------|--------|
| `src/js/element-state.ts` | deleted |
| `src/js/element-action.ts` | remove `elementState` param from interface |
| `src/js/mutation-handler.ts` | drop `elementState` field, add `addedNodes` filter |
| `src/js/navigation-handler.ts` | use direct DOM queries, fix hardcoded string |
| `src/js/content.ts` | fix type assertion, drop `elementState` from message handler |
| `src/js/actions/header-action.ts` | use direct DOM queries, drop `elementState` param |
| `src/js/actions/video-wrapper-action.ts` | fix initialization, use direct DOM queries |
| `src/js/actions/player-container-action.ts` | use direct DOM queries, drop `elementState` param |
| `src/js/actions/scrollbar-action.ts` | add Firefox scrollbar support |
| `src/js/utils/chrome-storage.ts` | fix default value check |
| `src/js/popup.ts` | remove `console.log` |
| `public/css/content.css` | fix `display: absolute` |
| `public/css/player.css` | fix magic number margin |
| `public/html/popup.html` | fix title |
