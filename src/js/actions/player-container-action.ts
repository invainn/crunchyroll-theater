import { PLAYER_CONTAINER } from "../utils/constants";
import { ElementAction } from "../element-action";

export class PlayerContainerAction implements ElementAction {
  initialized: boolean = false;

  canExecuteAction(): boolean {
    if (this.initialized) return false;
    return !!document.getElementById(PLAYER_CONTAINER);
  }

  execute(): void {
    if (!this.canExecuteAction()) return;
    this.initialized = true;
    PlayerContainerAction.togglePlayerContainer();
  }

  static togglePlayerContainer(): void {
    const element = document.getElementById(PLAYER_CONTAINER);
    if (!element) return;
    element.classList.toggle("ct-player-container");
  }
}
