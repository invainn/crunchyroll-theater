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
