/**
 * Represents the context of bound variables for a given AST matcher.
 */
export default class Context {
  private parent: Context | null;
  private storage: { [key: string]: any };

  constructor(parent?: Context) {
    this.parent = parent || null;
    this.storage = Object.create(parent && parent.storage || null);
  }

  /**
   * Binds a value in this context, if possible. Returns a boolean indicating whether the
   * binding was successful (i.e., either the key was previously undefined or it already
   * contained the given value).
   */
  bind(key: string, value: any): boolean {
    if (key in this.storage) {
      return this.storage[key] === value;
    } else {
      this.storage[key] = value;
      return true;
    }
  }

  /**
   * Exposes the bound values on this context in a POJO.
   */
  expose(): { [key: string]: any } {
    return Object.create(this.storage);
  }

  /**
   * Creates a provisional version of this context to bind values into. Those bound values
   * can later be committed to the context to make them permanent.
   */
  createProvisionalContext() {
    return new Context(this);
  }

  /**
   * Applies all values bound on this provisional context to the parent that originally begat it.
   */
  commit() {
    if (!this.parent) {
      throw new Error('Internal error: unable to apply provisional values from a context with no parent');
    }

    Object.keys(this.storage).forEach((key) => {
      this.parent!.storage[key] = this.storage[key];
    });
  }
}
