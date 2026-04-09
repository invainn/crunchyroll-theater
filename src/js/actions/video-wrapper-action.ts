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
