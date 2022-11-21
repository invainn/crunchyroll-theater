export class ScrollbarAction {
  static initialized: boolean = false;

  static removeScrollbarElement: HTMLElement =
    ScrollbarAction.createRemoveScrollbarElement();

  static createRemoveScrollbarElement(): HTMLElement {
    const removeScrollbarElement = document.createElement("style");
    removeScrollbarElement.id = "remove-scrollbar";
    removeScrollbarElement.textContent +=
      "html::-webkit-scrollbar{display:none !important}";
    removeScrollbarElement.textContent +=
      "body::-webkit-scrollbar{display:none !important}";

    return removeScrollbarElement;
  }

  static toggleScrollbar(removeScrollbar: boolean) {
    if (removeScrollbar) {
      document.body.appendChild(ScrollbarAction.removeScrollbarElement);
    } else {
      const removeScrollbarElement =
        document.getElementById("remove-scrollbar");

      if (removeScrollbarElement) {
        removeScrollbarElement.remove();
      }
    }
  }
}
