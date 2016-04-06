/**
 * Represents the context of bound variables for a given AST matcher.
 */
export default class Context {
  constructor(parent = null) {
    this.parent = parent;
    this.storage = Object.create(parent && parent.storage);
  }

  /**
   * Binds a value in this context, if possible. Returns a boolean indicating whether the
   * binding was successful (i.e., either the key was previously undefined or it already
   * contained the given value).
   */
  bind(key, value) {
    if (key in this.storage) {
      if (this.storage[key] === value) {
        return true;
      }
    } else {
      this.storage[key] = value;
      return true;
    }
  }

  /**
   * Exposes the bound values on this context in a POJO.
   */
  expose() {
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
    Object.keys(this.storage).forEach((key) => {
      this.parent.storage[key] = this.storage[key];
    });
  }
}
