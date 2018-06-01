import Context from './context';
import compileMatcher, { Matcher } from './compile-matcher';
import { isObject, isArray } from './utils';

export type Transform<Options> = (vars: any, options: Options, node: any) => any;
export interface Rule<Options> {
  match: Matcher,
  transform: Transform<Options>
}

/**
 * Recursively applies the given set of rules to the given object.
 */
export function applyRules<Options>(object: any, rules: Rule<Options>[], options: Options): any {
  if (isObject(object)) {
    let result = Object.getPrototypeOf(object) ? {} : Object.create(null);
    Object.keys(object).forEach((key) => {
      result[key] = applyRules(object[key], rules, options);
    });
    return applyMatchingRule(result, rules, options);
  } else if (isArray(object)) {
    let result = object.map(node => applyRules(node, rules, options));
    return applyMatchingRule(result, rules, options);
  } else {
    return object;
  }
}

/**
 * Given an object or array containing a combination of rule definitions and other such
 * arrays/objects, returns a flattened array of canonicalized rules.
 */
export function extractRules<Options = any>(object: any): Array<Rule<Options>> {
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
export function compileRule<Options>(spec: any, transform: Transform<Options>): Rule<Options> {
  let match = compileMatcher(spec);
  return { match, transform };
}

/**
 * Given an object, a matcher spec, and the name of a method on that object representing an
 * AST transform, compiles and stores the matcher on that object for later retrieval.
 */
export function memoizeRule(object: any, transformKey: string, spec: any): void {
  if (!(RULES in object)) object[RULES] = [];

  let match = compileMatcher(spec);
  object[RULES].push({ match, transformKey });
}

// Key where rule annotations are stashed on a decorated object. We don't use a Symbol because
// they're never exposed in for-in loops, so it makes working with e.g. Ember objects unwieldy.
export const RULES = '__botanist-rules';

// Find a rule matching the given node and apply it, or just return the node
function applyMatchingRule<Options>(node: any, rules: Array<Rule<Options>>, options: Options): any {
  let context = new Context();
  for (let i = 0, len = rules.length; i < len; i++) {
    let rule = rules[i];
    if (rule.match(node, context)) {
      return rule.transform.call(null, context.expose(), options, node);
    }
  }
  return node;
}

// Extract an array of canonicalized rules from an object
function rulesFromObject<Options>(object: any): Array<Rule<Options>> | undefined {
  if (object[RULES]) {
    let rules: Array<{ match: Matcher, transformKey: string }> = object[RULES];
    return rules.map(({ match, transformKey }) => ({
      match,
      transform: (...params: any[]) => object[transformKey](...params)
    }));
  } else if (isArray(object)) {
    return object;
  }
}
