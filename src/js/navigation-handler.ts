import { ElementState } from "./element-state";
import {
  HEADER,
  HEADER_CONTAINER,
  REMOVE_SCROLLBAR_STORAGE_KEY,
  VIDEO_WRAPPER,
} from "./utils/constants";
import { HeaderAction } from "./actions/header-action";
import { ChromeStorage } from "./utils/chrome-storage";
import { VideoWrapperAction } from "./actions/video-wrapper-action";
import { ScrollbarAction } from "./actions/scrollbar-action";

export class NavigationHandler {
  static handle(elementState: ElementState): void {
    ChromeStorage.fetchStorageValue("hideHeader").then((hideHeader) => {
      if (
        elementState.checkElementExistsByClassName(
          HEADER,
          HEADER_CONTAINER,
          VIDEO_WRAPPER
        )
      ) {
        if (globalThis.initializedVideoPage) return;

        globalThis.initializedVideoPage = true;
        HeaderAction.toggleHeader(elementState, hideHeader as boolean);
        HeaderAction.toggleHeaderTheater(elementState, true);
        VideoWrapperAction.toggleVideoPlayerSpacing(hideHeader as boolean);
      } else if (
        elementState.checkElementExistsByClassName(HEADER, HEADER_CONTAINER)
      ) {
        if (!globalThis.initializedVideoPage) return;

        globalThis.initializedVideoPage = false;
        HeaderAction.toggleHeader(elementState, false);
        HeaderAction.toggleHeaderTheater(elementState, false);
      }
    });

    if (!ScrollbarAction.initialized) {
      ChromeStorage.fetchStorageValue(REMOVE_SCROLLBAR_STORAGE_KEY).then(
        (removeScrollBar) => {
          ScrollbarAction.initialized = true;
          ScrollbarAction.toggleScrollbar(removeScrollBar as boolean);
        }
      );
    }
  }
}
