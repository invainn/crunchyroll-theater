import { ElementAction } from "./element-action";
import { NavigationHandler } from "./navigation-handler";

export class MutationObserverHandler {
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
    const hasAddedNodes = mutations.some((m) => m.addedNodes.length > 0);
    if (!hasAddedNodes) return;

    this.actions.forEach((action) => action.execute());
    NavigationHandler.handle();
  }
}
