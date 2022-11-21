import { PLAYER_CONTAINER } from "../utils/constants";
import { ElementAction } from "../element-action";
import { ElementState } from "../element-state";

export class PlayerContainerAction implements ElementAction {
  initialized: boolean = false;

  canExecuteAction(elementState: ElementState): boolean {
    if (this.initialized) return false;
    return elementState.checkElementExistsById(PLAYER_CONTAINER);
  }

  static fetchElement(elementState: ElementState): Element {
    return elementState.fetchStateById(PLAYER_CONTAINER);
  }

  execute(elementState: ElementState): void {
    if (!this.canExecuteAction(elementState)) return;

    this.initialized = true;
    PlayerContainerAction.togglePlayerContainer(elementState);
  }

  static togglePlayerContainer(elementState: ElementState): void {
    const element = PlayerContainerAction.fetchElement(elementState);
    element.classList.toggle("ct-player-container");
  }
}
