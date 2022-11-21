import { ChromeStorage } from "../utils/chrome-storage";
import { HIDE_HEADER_STORAGE_KEY, VIDEO_WRAPPER } from "../utils/constants";

export class VideoWrapperAction {
  initialized: boolean = false;

  canExecuteAction(): boolean {
    return document.getElementsByClassName(VIDEO_WRAPPER).length > 0;
  }

  static fetchElement(): Element {
    return document.getElementsByClassName(VIDEO_WRAPPER)[0];
  }

  execute(): void {
    if (!this.canExecuteAction()) return;

    // TODO: super sloppy that we're not initializing here, but we need to check
    // if the classes exist on the element, if not, then continue instead of initializing once
    // since we can't guarantee that element will be there after we apply the changes
    ChromeStorage.fetchStorageValue(HIDE_HEADER_STORAGE_KEY).then(
      (hideHeader) => {
        VideoWrapperAction.toggleVideoPlayerSpacing(hideHeader as boolean);
      }
    );
  }

  static toggleVideoPlayerSpacing(hideHeader: boolean): void {
    const element = VideoWrapperAction.fetchElement();
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
