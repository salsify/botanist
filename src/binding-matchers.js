import { isArray, isSimple } from './utils';

/**
 * Matches any simple value and binds it to the given name in the rule handler.
 * The following would match any object with only a `key` property whose value
 * was a string, number, boolean, etc. It would also match non-POJO objects, such
 * as Ember class instances.
 *
 *  @rule({ key: simple('name') })
 *  shoutName({ name }) {
 *    return { key: name.toUpperCase() };
 *  }
 *
 * Input:  { foo: { key: 'one' }, bar: { key: 'two' } }
 * Output: { foo: { key: 'ONE' }, bar: { key: 'TWO' } }}
 */
export function simple(name) {
  return binder(name, node => isSimple(node) ? node : NO_MATCH);
}

/**
 * Matches any simple value that is in the given list.
 *
 * @rule({ measure: simple('measure'), unit: choice(['in', 'ft'], 'unit') })
 * convertToMetric({ measure, unit }) {
 *   let factor = unit === 'ft' ? 30.48 : 2.54;
 *   return { measure: measure * factor, unit: 'cm' };
 * }
 *
 * Input:  { measure: 3, unit: 'in' }
 * Output: { measure: 7.62, unit: 'cm' }
 *
 * Input:  { measure: 3, unit: 'cm' }
 * Output: { measure: 3, unit: 'cm' }
 */
export function choice(options, name) {
  return binder(name, node => isSimple(node) && options.indexOf(node) !== -1 ? node : NO_MATCH);
}

/**
 * Matches any string that matches the given regex, binding the results of that
 * regex's execution to the given name.
 *
 *  @rule({ key: match(/^(foo|bar)(baz|qux)$/, 'keyParts') })
 *  shoutName({ keyParts: [first, second, everything] }) {
 *    return { first, second, everything };
 *  }
 *
 * Input:  { foo: { key: 'fooqux' } }
 * Output: { foo: { first: 'foo', second: 'qux', everything: 'fooqux' } }
 */
export function match(regex, name) {
  return binder(name, (node) => {
    let matchResult;
    if (isSimple(node) && (matchResult = regex.exec(node))) {
      return matchResult.slice(1).concat(matchResult[0]);
    } else {
      return NO_MATCH;
    }
  });
}

/**
 * Matches an array of simple values, binding it to the given name.
 *
 *  @rule({ numbers: sequence('numbers') })
 *  increment({ numbers }) {
 *    return numbers.map(n => n + 1);
 *  }
 *
 * Input:  { numbers: [1, 2, 3] }
 * Output: { numbers: [2, 3, 4] }
 */
export function sequence(name) {
  return binder(name, node => isArray(node) && node.every(isSimple) ? node : NO_MATCH);
}

/**
 * Matches any subtree, including complex values, binding it to the given name. Note
 * that any such rule will be applied AFTER rules that match the subtree.
 *
 *  @rule({ key: simple('key') })
 *  shout({ key }) {
 *   return { key: key.toUpperCase() };
 *  }
 *
 *  @rule({ root: subtree('root') })
 *  values({ root }) {
 *    return { root: Object.values(root) };
 *  }
 *
 *  Input:  { root: { key: 'hello' } }
 *  Output: { root: ['HELLO'] }
 */
export function subtree(name) {
  return binder(name, node => node);
}


const NO_MATCH = Object.freeze({});

function binder(name, test) {
  return (node, context) => {
    let result = test(node);
    if (result !== NO_MATCH) {
      return !name || context.bind(name, result);
    }
  };
}
