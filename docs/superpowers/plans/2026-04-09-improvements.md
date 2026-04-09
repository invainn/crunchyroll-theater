# Crunchyroll Theater Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix real bugs, remove the fragile `ElementState` DOM cache, repair `VideoWrapperAction` initialization, and narrow the `MutationObserver` — preserving all existing functionality.

**Architecture:** Two tasks. Task 1 applies standalone bug fixes that build cleanly on their own. Task 2 does the complete `ElementState` removal in one pass — all files touching the interface, implementations, and handlers are updated together before the final build and commit, so the repo is never left in a broken state.

**Tech Stack:** TypeScript, Rollup, Chrome Extension Manifest V3, SCSS/Bootstrap

---

## Files Changed

| File | Change |
|------|--------|
| `public/css/content.css` | fix invalid `display: absolute` |
| `public/html/popup.html` | fix title |
| `src/js/popup.ts` | remove debug `console.log` |
| `public/css/player.css` | fix magic-number margin |
| `src/js/utils/chrome-storage.ts` | fix broken default-value check |
| `src/js/actions/scrollbar-action.ts` | add Firefox scrollbar support |
| `src/js/element-action.ts` | drop `elementState` param from interface |
| `src/js/actions/header-action.ts` | direct DOM queries, drop `elementState` param |
| `src/js/actions/video-wrapper-action.ts` | direct DOM queries, fix `initialized` bug, drop `elementState` param |
| `src/js/actions/player-container-action.ts` | direct DOM queries, drop `elementState` param |
| `src/js/mutation-handler.ts` | drop `elementState` field, add `addedNodes` filter |
| `src/js/navigation-handler.ts` | direct DOM queries, use `HIDE_HEADER_STORAGE_KEY` constant |
| `src/js/content.ts` | drop `elementState` from all call sites, fix type assertions |
| `src/js/element-state.ts` | **deleted** |

---

## Task 1: Standalone Bug Fixes

These changes are independent of the `ElementState` refactor and can be applied, built, and committed on their own.

**Files:**
- Modify: `public/css/content.css`
- Modify: `public/html/popup.html`
- Modify: `src/js/popup.ts`
- Modify: `public/css/player.css`
- Modify: `src/js/utils/chrome-storage.ts`
- Modify: `src/js/actions/scrollbar-action.ts`

- [ ] **Step 1: Fix invalid CSS in `public/css/content.css`**

  `display: absolute` is not valid CSS. The intent is to overlay the header so it floats above content.

  Change line 14:
  ```css
  /* before */
  .erc-header.ct-header-theater {
  	display: absolute;
  }

  /* after */
  .erc-header.ct-header-theater {
  	position: absolute;
  }
  ```

- [ ] **Step 2: Fix popup HTML title in `public/html/popup.html`**

  Change line 6:
  ```html
  <!-- before -->
  <title>Bootstrap demo</title>

  <!-- after -->
  <title>Crunchyroll Theater</title>
  ```

- [ ] **Step 3: Remove debug `console.log` from `src/js/popup.ts`**

  Remove line 25:
  ```ts
  console.log(setting as boolean);
  ```

- [ ] **Step 4: Fix magic-number margin in `public/css/player.css`**

  `-60.984px` is a hardcoded pixel value that will break at different font sizes. The header height is defined as `3.75rem` in `content.css` — use the same unit here.

  Change line 4:
  ```css
  /* before */
    margin-top: -60.984px;

  /* after */
    margin-top: -3.75rem;
  ```

- [ ] **Step 5: Fix broken default-value check in `src/js/utils/chrome-storage.ts`**

  `if (!keys)` is always false — `chrome.storage.sync.get` always returns an object. Use nullish coalescing so unset keys resolve to `false` (the correct default for both `hideHeader` and `removeScrollbar`).

  Replace the entire file with:
  ```ts
  type StorageValue = string | boolean;

  export class ChromeStorage {
    public static setStorageKey(key: string, value: StorageValue) {
      chrome.storage.sync.set({
        [key]: value,
      });
    }

    public static async fetchStorageValue(key: string): Promise<StorageValue> {
      return new Promise((resolve) => {
        chrome.storage.sync.get([key], (result) => {
          resolve(result[key] ?? false);
        });
      });
    }
  }
  ```

- [ ] **Step 6: Add Firefox scrollbar support in `src/js/actions/scrollbar-action.ts`**

  The current implementation only hides the scrollbar in Chromium browsers via `-webkit-scrollbar`. Firefox uses `scrollbar-width: none`.

  Replace the entire file with:
  ```ts
  export class ScrollbarAction {
    static initialized: boolean = false;

    static removeScrollbarElement: HTMLElement =
      ScrollbarAction.createRemoveScrollbarElement();

    static createRemoveScrollbarElement(): HTMLElement {
      const removeScrollbarElement = document.createElement("style");
      removeScrollbarElement.id = "remove-scrollbar";
      removeScrollbarElement.textContent +=
        "html::-webkit-scrollbar{display:none !important}";
      removeScrollbarElement.textContent +=
        "body::-webkit-scrollbar{display:none !important}";
      removeScrollbarElement.textContent +=
        "html{scrollbar-width:none !important}";
      removeScrollbarElement.textContent +=
        "body{scrollbar-width:none !important}";

      return removeScrollbarElement;
    }

    static toggleScrollbar(removeScrollbar: boolean) {
      if (removeScrollbar) {
        document.body.appendChild(ScrollbarAction.removeScrollbarElement);
      } else {
        const removeScrollbarElement =
          document.getElementById("remove-scrollbar");

        if (removeScrollbarElement) {
          removeScrollbarElement.remove();
        }
      }
    }
  }
  ```

- [ ] **Step 7: Build to verify no errors**

  ```bash
  yarn build
  ```

  Expected: build completes with no TypeScript errors. Rollup may emit circular dependency warnings — these are pre-existing and can be ignored.

- [ ] **Step 8: Commit**

  ```bash
  git add public/css/content.css public/html/popup.html src/js/popup.ts public/css/player.css src/js/utils/chrome-storage.ts src/js/actions/scrollbar-action.ts
  git commit -m "fix: invalid CSS, console.log, magic number margin, storage default, Firefox scrollbar"
  ```

---

## Task 2: Remove ElementState and Narrow MutationObserver

All files that reference `ElementState` are updated together in this task before the build runs — so the repo is never left in a broken intermediate state. Update the interface and all implementations first, then the handlers, then delete the file.

**Files:**
- Modify: `src/js/element-action.ts`
- Modify: `src/js/actions/header-action.ts`
- Modify: `src/js/actions/video-wrapper-action.ts`
- Modify: `src/js/actions/player-container-action.ts`
- Modify: `src/js/mutation-handler.ts`
- Modify: `src/js/navigation-handler.ts`
- Modify: `src/js/content.ts`
- Delete: `src/js/element-state.ts`

- [ ] **Step 1: Simplify `ElementAction` interface in `src/js/element-action.ts`**

  Drop the `elementState` parameter and the optional helper methods. The optional `canExecuteAction?` and `fetchElement?` created an inconsistent contract — callers couldn't rely on them existing.

  Replace the entire file with:
  ```ts
  export interface ElementAction {
    initialized: boolean;
    execute(): void;
  }
  ```

- [ ] **Step 2: Update `src/js/actions/header-action.ts`**

  Drop `ElementState` — query the DOM directly in every method.

  Replace the entire file with:
  ```ts
  import {
    HEADER,
    HEADER_CONTAINER,
    HIDE_HEADER_STORAGE_KEY,
  } from "../utils/constants";
  import { ElementAction } from "../element-action";
  import { ChromeStorage } from "../utils/chrome-storage";

  export class HeaderAction implements ElementAction {
    initialized: boolean = false;
    static scheduledAnimationFrame: boolean = false;

    canExecuteAction(): boolean {
      if (this.initialized) return false;
      return (
        document.getElementsByClassName(HEADER).length > 0 &&
        document.getElementsByClassName(HEADER_CONTAINER).length > 0
      );
    }

    execute(): void {
      if (!this.canExecuteAction() || !globalThis.initializedVideoPage) return;

      this.initialized = true;
      const element = document.getElementsByClassName(HEADER)[0];
      element.classList.toggle("ct-header");

      ChromeStorage.fetchStorageValue(HIDE_HEADER_STORAGE_KEY).then(
        (hideHeader) => {
          HeaderAction.toggleHeader(hideHeader as boolean);
          HeaderAction.toggleHeaderTheater(true);
        },
      );
    }

    static toggleHeader(hideHeader: boolean): void {
      const headers = document.getElementsByClassName(HEADER_CONTAINER);
      if (headers.length === 0) return;
      const headerContainer = headers[0];
      if (hideHeader) {
        headerContainer.classList.add("ct-hide-header");
        headerContainer.classList.add("ct-specify");
      } else {
        headerContainer.classList.remove("ct-hide-header");
        headerContainer.classList.remove("ct-specify");
      }
    }

    static toggleHeaderTheater(headerTheaterOn: boolean): void {
      const headers = document.getElementsByClassName(HEADER);
      if (headers.length === 0) return;
      const header = headers[0] as HTMLElement;
      ChromeStorage.fetchStorageValue(HIDE_HEADER_STORAGE_KEY).then(
        (hideHeader) => {
          if (headerTheaterOn && hideHeader) {
            header.classList.add("ct-header-theater");

            header.onmouseenter = () => {
              if (HeaderAction.scheduledAnimationFrame) return;
              HeaderAction.scheduledAnimationFrame = true;
              requestAnimationFrame(() => {
                HeaderAction.toggleHeader(false);
                HeaderAction.scheduledAnimationFrame = false;
              });
            };

            header.onmouseleave = () => {
              if (HeaderAction.scheduledAnimationFrame) return;
              HeaderAction.scheduledAnimationFrame = true;
              requestAnimationFrame(() => {
                HeaderAction.toggleHeader(true);
                HeaderAction.scheduledAnimationFrame = false;
              });
            };
          } else {
            header.classList.remove("ct-header-theater");
            header.onmouseenter = null;
            header.onmouseleave = null;
            HeaderAction.toggleHeader(false);
          }
        },
      );
    }
  }
  ```

- [ ] **Step 3: Update `src/js/actions/video-wrapper-action.ts`**

  Two fixes: drop `ElementState` (query DOM directly), and fix the `initialized` bug — previously `execute()` never set `this.initialized = true`, so it fired a storage read on every DOM mutation.

  Replace the entire file with:
  ```ts
  import { ChromeStorage } from "../utils/chrome-storage";
  import { HIDE_HEADER_STORAGE_KEY, VIDEO_WRAPPER } from "../utils/constants";
  import { ElementAction } from "../element-action";

  export class VideoWrapperAction implements ElementAction {
    initialized: boolean = false;

    canExecuteAction(): boolean {
      return document.getElementsByClassName(VIDEO_WRAPPER).length > 0;
    }

    execute(): void {
      if (this.initialized || !this.canExecuteAction()) return;
      this.initialized = true;
      ChromeStorage.fetchStorageValue(HIDE_HEADER_STORAGE_KEY).then(
        (hideHeader) => {
          VideoWrapperAction.toggleVideoPlayerSpacing(hideHeader as boolean);
        },
      );
    }

    static toggleVideoPlayerSpacing(hideHeader: boolean): void {
      const elements = document.getElementsByClassName(VIDEO_WRAPPER);
      if (elements.length === 0) return;
      const element = elements[0];
      element.classList.add("ct-specify");
      if (hideHeader) {
        element.classList.add("ct-video-wrapper");
        element.classList.remove("ct-video-wrapper-spacing");
      } else {
        element.classList.remove("ct-video-wrapper");
        element.classList.add("ct-video-wrapper-spacing");
      }
    }
  }
  ```

- [ ] **Step 4: Update `src/js/actions/player-container-action.ts`**

  Drop `ElementState` — query DOM directly.

  Replace the entire file with:
  ```ts
  import { PLAYER_CONTAINER } from "../utils/constants";
  import { ElementAction } from "../element-action";

  export class PlayerContainerAction implements ElementAction {
    initialized: boolean = false;

    canExecuteAction(): boolean {
      if (this.initialized) return false;
      return !!document.getElementById(PLAYER_CONTAINER);
    }

    execute(): void {
      if (!this.canExecuteAction()) return;
      this.initialized = true;
      PlayerContainerAction.togglePlayerContainer();
    }

    static togglePlayerContainer(): void {
      const element = document.getElementById(PLAYER_CONTAINER);
      if (!element) return;
      element.classList.toggle("ct-player-container");
    }
  }
  ```

- [ ] **Step 5: Update `src/js/mutation-handler.ts`**

  Drop the `elementState` field and import. Add an `addedNodes` filter so the action loop only runs when nodes are being added (navigation events), not on every attribute change or text update.

  Replace the entire file with:
  ```ts
  import { ElementAction } from "./element-action";
  import { NavigationHandler } from "./navigation-handler";

  export class MutationObserverHandler {
    observer: MutationObserver;
    actions: ElementAction[];

    public constructor(...actions: ElementAction[]) {
      this.actions = actions;
      this.observer = new MutationObserver(this.observerCallback.bind(this));

      this.observer.observe(document.body, {
        childList: true,
        attributes: true,
        characterData: false,
        subtree: true,
      });
    }

    observerCallback(mutations: MutationRecord[]) {
      const hasAddedNodes = mutations.some((m) => m.addedNodes.length > 0);
      if (!hasAddedNodes) return;

      this.actions.forEach((action) => action.execute());
      NavigationHandler.handle();
    }
  }
  ```

- [ ] **Step 6: Update `src/js/navigation-handler.ts`**

  Drop `ElementState` — check for elements directly with `getElementsByClassName`. Fix the hardcoded `"hideHeader"` string to use `HIDE_HEADER_STORAGE_KEY`.

  Replace the entire file with:
  ```ts
  import {
    HEADER,
    HEADER_CONTAINER,
    HIDE_HEADER_STORAGE_KEY,
    REMOVE_SCROLLBAR_STORAGE_KEY,
    VIDEO_WRAPPER,
  } from "./utils/constants";
  import { HeaderAction } from "./actions/header-action";
  import { ChromeStorage } from "./utils/chrome-storage";
  import { VideoWrapperAction } from "./actions/video-wrapper-action";
  import { ScrollbarAction } from "./actions/scrollbar-action";

  function elementsExistByClassName(...classNames: string[]): boolean {
    return classNames.every(
      (cn) => document.getElementsByClassName(cn).length > 0,
    );
  }

  export class NavigationHandler {
    static handle(): void {
      ChromeStorage.fetchStorageValue(HIDE_HEADER_STORAGE_KEY).then(
        (hideHeader) => {
          if (
            elementsExistByClassName(HEADER, HEADER_CONTAINER, VIDEO_WRAPPER)
          ) {
            if (globalThis.initializedVideoPage) return;

            globalThis.initializedVideoPage = true;
            HeaderAction.toggleHeader(hideHeader as boolean);
            HeaderAction.toggleHeaderTheater(true);
            VideoWrapperAction.toggleVideoPlayerSpacing(hideHeader as boolean);
          } else if (elementsExistByClassName(HEADER, HEADER_CONTAINER)) {
            if (!globalThis.initializedVideoPage) return;

            globalThis.initializedVideoPage = false;
            HeaderAction.toggleHeader(false);
            HeaderAction.toggleHeaderTheater(false);
          }
        },
      );

      if (!ScrollbarAction.initialized) {
        ChromeStorage.fetchStorageValue(REMOVE_SCROLLBAR_STORAGE_KEY).then(
          (removeScrollBar) => {
            ScrollbarAction.initialized = true;
            ScrollbarAction.toggleScrollbar(removeScrollBar as boolean);
          },
        );
      }
    }
  }
  ```

- [ ] **Step 7: Update `src/js/content.ts`**

  Drop `ElementState` import and usage. Fix two operator-precedence bugs: `!hideHeader as boolean` and `!removeScrollbar` cast before negation — should be `!(x as boolean)`. The `CLEAR_ELEMENT_STATE_MESSAGE` handler no longer recreates an `ElementState`; it just calls `NavigationHandler.handle()` to re-detect page state.

  Replace the entire file with:
  ```ts
  import { HeaderAction } from "./actions/header-action";
  import { ScrollbarAction } from "./actions/scrollbar-action";
  import { VideoWrapperAction } from "./actions/video-wrapper-action";
  import { MutationObserverHandler } from "./mutation-handler";
  import { NavigationHandler } from "./navigation-handler";
  import { ChromeStorage } from "./utils/chrome-storage";
  import {
    CLEAR_ELEMENT_STATE_MESSAGE,
    HIDE_HEADER_STORAGE_KEY,
    REMOVE_SCROLLBAR_STORAGE_KEY,
    TOGGLE_HEADER_MESSAGE,
    TOGGLE_SCROLLBAR_MESSAGE,
  } from "./utils/constants";

  declare global {
    var initializedVideoPage: boolean;
  }

  new MutationObserverHandler(new HeaderAction(), new VideoWrapperAction());

  chrome.runtime.onMessage.addListener(async (req) => {
    if (req.msg === TOGGLE_HEADER_MESSAGE && globalThis.initializedVideoPage) {
      const hideHeader = await ChromeStorage.fetchStorageValue(
        HIDE_HEADER_STORAGE_KEY,
      );
      ChromeStorage.setStorageKey(HIDE_HEADER_STORAGE_KEY, !hideHeader);

      HeaderAction.toggleHeader(!(hideHeader as boolean));
      HeaderAction.toggleHeaderTheater(true);
      VideoWrapperAction.toggleVideoPlayerSpacing(!(hideHeader as boolean));
    }

    if (req.msg === TOGGLE_SCROLLBAR_MESSAGE) {
      const removeScrollbar = await ChromeStorage.fetchStorageValue(
        REMOVE_SCROLLBAR_STORAGE_KEY,
      );
      ChromeStorage.setStorageKey(
        REMOVE_SCROLLBAR_STORAGE_KEY,
        !removeScrollbar,
      );
      ScrollbarAction.toggleScrollbar(!(removeScrollbar as boolean));
    }

    if (req.msg === CLEAR_ELEMENT_STATE_MESSAGE) {
      NavigationHandler.handle();
    }
  });
  ```

- [ ] **Step 8: Delete `src/js/element-state.ts`**

  ```bash
  rm src/js/element-state.ts
  ```

- [ ] **Step 9: Build to verify no errors**

  ```bash
  yarn build
  ```

  Expected: build completes with no TypeScript errors. If you see "Cannot find module './element-state'", there is a remaining import — find it with:

  ```bash
  grep -r "element-state" src/
  ```

  Any file listed still imports `ElementState` and needs to be updated per the steps above.

- [ ] **Step 10: Commit**

  ```bash
  git add src/js/element-action.ts src/js/actions/header-action.ts src/js/actions/video-wrapper-action.ts src/js/actions/player-container-action.ts src/js/mutation-handler.ts src/js/navigation-handler.ts src/js/content.ts
  git rm src/js/element-state.ts
  git commit -m "refactor: remove ElementState cache, narrow MutationObserver, fix navigation handler"
  ```
