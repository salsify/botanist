import Context from './context';
import compileMatcher from './compile-matcher';
import { isObject, isArray } from './utils';

/**
 * Recursively applies the given set of rules to the given AST.
 */
export function applyRules(ast, rules, options) {
  if (isObject(ast)) {
    let result = Object.create(null);
    for (let key of Object.keys(ast)) {
      result[key] = applyRules(ast[key], rules, options);
    }
    return applyMatchingRule(result, rules, options);
  } else if (isArray(ast)) {
    let result = ast.map(node => applyRules(node, rules, options));
    return applyMatchingRule(result, rules, options);
  } else {
    return ast;
  }
}

/**
 * Given an object or array containing a combination of rule definitions and other such
 * arrays/objects, returns a flattened array of canonicalized rules.
 */
export function extractRules(object) {
  let rules = rulesFromObject(object);
  if (!isArray(rules)) return [object];

  let flattened = [];
  for (let i = 0, len = rules.length; i < len; i++) {
    flattened.push(...extractRules(rules[i]));
  }
  return flattened;
}

/**
 * Given a matcher spec and a transform function, immediately compiles the pair into a rule.
 */
export function compileRule(spec, transform) {
  let match = compileMatcher(spec);
  return { match, transform };
}

/**
 * Given an object, a matcher spec, and the name of a method on that object representing an
 * AST transform, compiles and stores the matcher on that object for later retrieval.
 */
export function memoizeRule(object, transformKey, spec) {
  if (!(RULES in object)) object[RULES] = [];

  let match = compileMatcher(spec);
  object[RULES].push({ match, transformKey });
}

// Key where rule annotations are stashed on a decorated object. We don't use a Symbol because
// they're never exposed in for-in loops, so it makes working with e.g. Ember objects unwieldy.
const RULES = '__botanist-rules';

// Find a rule matching the given node and apply it, or just return the node
function applyMatchingRule(node, rules, options) {
  let context = new Context();
  for (let rule of rules) {
    if (rule.match(node, context)) {
      return rule.transform.call(null, context.expose(), options, node);
    }
  }
  return node;
}

// Extract an array of canonicalized rules from an object
function rulesFromObject(object) {
  if (object[RULES]) {
    return object[RULES].map(({ match, transformKey }) => ({
      match,
      transform: (...params) => object[transformKey](...params)
    }));
  } else if (isArray(object)) {
    return object;
  }
}
