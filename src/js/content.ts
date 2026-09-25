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

async function handleMessage(msg: string): Promise<void> {
  if (msg === TOGGLE_HEADER_MESSAGE) {
    const hideHeader = !(await ChromeStorage.fetchStorageValue(
      HIDE_HEADER_STORAGE_KEY,
    ));
    // Persist the setting on every page so the popup switch stays in sync,
    // but only touch the DOM when theater mode is active.
    ChromeStorage.setStorageKey(HIDE_HEADER_STORAGE_KEY, hideHeader);
    if (!globalThis.initializedVideoPage) return;

    HeaderAction.toggleHeader(hideHeader);
    HeaderAction.toggleHeaderTheater(true, hideHeader);
    VideoWrapperAction.toggleVideoPlayerSpacing(hideHeader);
  }

  if (msg === TOGGLE_SCROLLBAR_MESSAGE) {
    const removeScrollbar = !(await ChromeStorage.fetchStorageValue(
      REMOVE_SCROLLBAR_STORAGE_KEY,
    ));
    ChromeStorage.setStorageKey(REMOVE_SCROLLBAR_STORAGE_KEY, removeScrollbar);
    ScrollbarAction.toggleScrollbar(removeScrollbar);
  }

  if (msg === CLEAR_ELEMENT_STATE_MESSAGE) {
    NavigationHandler.handle();
  }
}

chrome.runtime.onMessage.addListener((req) => {
  void handleMessage(req.msg);
});
