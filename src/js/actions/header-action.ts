import { HEADER, HEADER_CONTAINER } from "../constants";
import { ElementAction } from "../element-action";
import { ElementState } from "../element-state";

export class HeaderAction implements ElementAction {
	initialized: boolean = false;

	canExecuteAction(elementState: ElementState): boolean {
		if (this.initialized) return false;
		return elementState.checkElementExistsByClassName(
			HEADER,
			HEADER_CONTAINER,
		)
	}

	fetchElement(elementState: ElementState): Element {
		return elementState.fetchStateByClassName(HEADER)
	}

	execute(elementState: ElementState): void {
		this.initialized = true;
		const element = this.fetchElement(elementState);
		element.classList.toggle('ct-header');
	}
}