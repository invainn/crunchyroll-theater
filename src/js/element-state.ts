// TODO: probably scrap all of this
export class ElementState {
  // string in this case can be the identifier for the element
  // the identifier being either the class name or the id
  state: Record<string, Element> = {};

  private fetchStateByMethod(id: string, fn: Function): Element {
    if (!(id in this.state)) {
      const result = fn(id);

      if (result instanceof HTMLCollection) {
        if (result.length > 0) {
          this.state[id] = result[0];

          return result[0];
        }
        throw Error(`could not find element by className ${id}`);
      }

      if (result) {
        this.state[id] = result;
        return result;
      }

      throw Error(`could not find element by id ${id}`);
    }

    return this.state[id];
  }

  public checkElementExistByMethod(fn: Function, ...ids: string[]): boolean {
    return ids.reduce((acc, id): boolean => {
      if (!acc) return false;
      try {
        return !!fn(id);
      } catch (_) {
        return false;
      }
    }, true as boolean);
  }

  public fetchStateById(elementId: string): Element {
    return this.fetchStateByMethod(
      elementId,
      document.getElementById.bind(document),
    );
  }

  public fetchStateByClassName(elementClassName: string): Element {
    return this.fetchStateByMethod(
      elementClassName,
      document.getElementsByClassName.bind(document),
    );
  }

  public checkElementExistsById(...ids: string[]): boolean {
    return this.checkElementExistByMethod(
      this.fetchStateById.bind(this),
      ...ids,
    );
  }

  public checkElementExistsByClassName(...ids: string[]): boolean {
    return this.checkElementExistByMethod(
      this.fetchStateByClassName.bind(this),
      ...ids,
    );
  }
}
