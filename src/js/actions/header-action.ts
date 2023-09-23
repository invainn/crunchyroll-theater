import {
  HEADER,
  HEADER_CONTAINER,
  HIDE_HEADER_STORAGE_KEY,
} from "../utils/constants";
import { ElementAction } from "../element-action";
import { ElementState } from "../element-state";
import { ChromeStorage } from "../utils/chrome-storage";

export class HeaderAction implements ElementAction {
  initialized: boolean = false;
  static scheduledAnimationFrame: boolean = false; // debouncing

  canExecuteAction(elementState: ElementState): boolean {
    if (this.initialized) return false;
    return elementState.checkElementExistsByClassName(HEADER, HEADER_CONTAINER);
  }

  static fetchElement(elementState: ElementState): Element {
    return elementState.fetchStateByClassName(HEADER);
  }

  execute(elementState: ElementState): void {
    if (
      !this.canExecuteAction(elementState) ||
      !globalThis.initializedVideoPage
    )
      return;

    this.initialized = true;
    const element = HeaderAction.fetchElement(elementState);
    element.classList.toggle("ct-header");

    // initialize hide header state
    ChromeStorage.fetchStorageValue(HIDE_HEADER_STORAGE_KEY).then(
      (hideHeader) => {
        HeaderAction.toggleHeader(elementState, hideHeader as boolean);
        HeaderAction.toggleHeaderTheater(elementState, true);
      },
    );
  }

  static toggleHeader(elementState: ElementState, hideHeader: boolean): void {
    const headerContainer =
      elementState.fetchStateByClassName(HEADER_CONTAINER);
    if (hideHeader) {
      headerContainer.classList.add("ct-hide-header");
      headerContainer.classList.add("ct-specify");
    } else {
      headerContainer.classList.remove("ct-hide-header");
      headerContainer.classList.remove("ct-specify");
    }
  }

  static toggleHeaderTheater(
    elementState: ElementState,
    headerTheaterOn: boolean,
  ): void {
    const header = HeaderAction.fetchElement(elementState) as HTMLElement;
    ChromeStorage.fetchStorageValue(HIDE_HEADER_STORAGE_KEY).then(
      (hideHeader) => {
        if (headerTheaterOn && hideHeader) {
          header.classList.add("ct-header-theater");

          header.onmouseenter = () => {
            if (HeaderAction.scheduledAnimationFrame) return;
            HeaderAction.scheduledAnimationFrame = true;
            requestAnimationFrame(async () => {
              HeaderAction.toggleHeader(elementState, false);
              HeaderAction.scheduledAnimationFrame = false;
            });
          };

          header.onmouseleave = () => {
            if (HeaderAction.scheduledAnimationFrame) return;
            HeaderAction.scheduledAnimationFrame = true;
            requestAnimationFrame(async () => {
              HeaderAction.toggleHeader(elementState, true);
              HeaderAction.scheduledAnimationFrame = false;
            });
          };
        } else {
          header.classList.remove("ct-header-theater");

          header.onmouseenter = null;
          header.onmouseleave = null;
          HeaderAction.toggleHeader(elementState, false);
        }
      },
    );
  }
}
