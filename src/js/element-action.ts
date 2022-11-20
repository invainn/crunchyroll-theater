import { ElementState } from "./element-state";

export interface ElementAction {
	initialized: boolean;

	canExecuteAction(elementState: ElementState): boolean;
	fetchElement(elementState: ElementState): Element;
	execute(elementState: ElementState): void;
}
