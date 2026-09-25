import {
  HEADER,
  HEADER_CONTAINER,
  HIDE_HEADER_STORAGE_KEY,
} from "../utils/constants";
import { ElementAction } from "../element-action";
import { ChromeStorage } from "../utils/chrome-storage";

export class HeaderAction implements ElementAction {
  initialized: boolean = false;
  // Debounces hover to one DOM update per frame. The latest hover state
  // wins, so a leave arriving in the same frame as an enter is not lost.
  static pendingFrame: number | null = null;
  static pendingHideHeader: boolean = false;

  static scheduleToggleHeader(hideHeader: boolean): void {
    HeaderAction.pendingHideHeader = hideHeader;
    if (HeaderAction.pendingFrame !== null) return;
    HeaderAction.pendingFrame = requestAnimationFrame(() => {
      HeaderAction.pendingFrame = null;
      HeaderAction.toggleHeader(HeaderAction.pendingHideHeader);
    });
  }

  static cancelScheduledToggle(): void {
    if (HeaderAction.pendingFrame === null) return;
    cancelAnimationFrame(HeaderAction.pendingFrame);
    HeaderAction.pendingFrame = null;
  }

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
        HeaderAction.toggleHeaderTheater(true, hideHeader as boolean);
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

  static toggleHeaderTheater(
    headerTheaterOn: boolean,
    hideHeader: boolean,
  ): void {
    const headers = document.getElementsByClassName(HEADER);
    if (headers.length === 0) return;
    const header = headers[0] as HTMLElement;
    if (headerTheaterOn && hideHeader) {
      header.classList.add("ct-header-theater");

      header.onmouseenter = () => HeaderAction.scheduleToggleHeader(false);
      header.onmouseleave = () => HeaderAction.scheduleToggleHeader(true);
    } else {
      // A queued hover update must not re-hide the header after this.
      HeaderAction.cancelScheduledToggle();
      header.classList.remove("ct-header-theater");
      header.onmouseenter = null;
      header.onmouseleave = null;
      HeaderAction.toggleHeader(false);
    }
  }
}
