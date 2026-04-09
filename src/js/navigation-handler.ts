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
