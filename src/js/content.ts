import { HeaderAction } from "./actions/header-action";
import { ScrollbarAction } from "./actions/scrollbar-action";
import { VideoWrapperAction } from "./actions/video-wrapper-action";
import { ElementState } from "./element-state";
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

const mutationObserverHandler = new MutationObserverHandler(
  new HeaderAction(),
  new VideoWrapperAction()
);

chrome.runtime.onMessage.addListener(async (req) => {
  if (req.msg === TOGGLE_HEADER_MESSAGE && globalThis.initializedVideoPage) {
    const hideHeader = await ChromeStorage.fetchStorageValue(
      HIDE_HEADER_STORAGE_KEY
    );
    ChromeStorage.setStorageKey(HIDE_HEADER_STORAGE_KEY, !hideHeader);

    HeaderAction.toggleHeader(
      mutationObserverHandler.elementState,
      !hideHeader as boolean
    );
    HeaderAction.toggleHeaderTheater(
      mutationObserverHandler.elementState,
      true
    );
    VideoWrapperAction.toggleVideoPlayerSpacing(!hideHeader as boolean);
  }

  if (req.msg === TOGGLE_SCROLLBAR_MESSAGE) {
    const removeScrollbar = await ChromeStorage.fetchStorageValue(
      REMOVE_SCROLLBAR_STORAGE_KEY
    );
    ChromeStorage.setStorageKey(REMOVE_SCROLLBAR_STORAGE_KEY, !removeScrollbar);
    ScrollbarAction.toggleScrollbar(!removeScrollbar);
  }

  if (req.msg === CLEAR_ELEMENT_STATE_MESSAGE) {
    mutationObserverHandler.elementState = new ElementState();
    NavigationHandler.handle(mutationObserverHandler.elementState);
  }
});
