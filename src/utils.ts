/**
 * Indicates whether a given value is "simple", i.e. it should be matched by the
 * simple() binding directive, and will not have recursive rules applied against it.
 */
export function isSimple(value: any): boolean {
  return !isArray(value) && !isObject(value) && !isFunction(value);
}

/**
 * Indicates whether the given value is an array.
 */
export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

/**
 * Indicates whether the given value is a POJO, typically created via an object literal.
 */
export function isObject(value: any): value is { [key: string]: any } {
  if (!value || typeof value !== 'object') return false;

  let proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * Indicates whether the given value is a function
 */
export function isFunction(value: any): value is Function {
  return typeof value === 'function';
}

/**
 * Indicates whether the given value is a string.
 */
export function isString(value: any): value is string {
  return typeof value === 'string';
}
