import { PLAYER_CONTAINER } from "../constants";
import { ElementAction } from "../element-action";
import { ElementState } from "../element-state";

export class PlayerContainerAction implements ElementAction {
	initialized: boolean = false;

	canExecuteAction(elementState: ElementState): boolean {
		if (this.initialized) return false;
		return elementState.checkElementExistsById(PLAYER_CONTAINER)
	}

	fetchElement(elementState: ElementState): Element {
		return elementState.fetchStateByClassName(PLAYER_CONTAINER)
	}

	execute(elementState: ElementState): void {
		this.initialized = true;
		const element = this.fetchElement(elementState);
		element.classList.toggle('ct-player-container');
	}
}