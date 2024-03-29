import { ElementAction } from "./element-action";
import { ElementState } from "./element-state";
import { NavigationHandler } from "./navigation-handler";

export class MutationObserverHandler {
  elementState: ElementState = new ElementState();
  observer: MutationObserver;
  actions: ElementAction[];

  public constructor(...actions: ElementAction[]) {
    this.actions = actions;
    this.observer = new MutationObserver(this.observerCallback.bind(this));

    this.observer.observe(document.body, {
      childList: true,
      attributes: true,
      characterData: false,
      subtree: true,
    });
  }

  observerCallback(mutations: MutationRecord[]) {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        this.actions.forEach((action) => {
          action.execute(this.elementState);
        });

        // TODO: pretty hacky, need to fire this on initial page load when header is loaded but whatever
        NavigationHandler.handle(this.elementState);
      }
    });
  }
}
