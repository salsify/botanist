import { isArray, isObject, isFunction } from './utils';

/**
 * Given a specification for a matcher, compiles that spec into a function that will
 * take an AST node and a binding context and return a boolean indicating whether that
 * AST node matches the original spec.
 *
 * If the matcher returns true and the spec included binding directives, the context
 * will also be updated with bound values for those directives.
 */
export default function compileMatcher(spec) {
  if (isArray(spec)) {
    return buildArrayMatcher(spec);
  } else if (isObject(spec)) {
    return buildObjectMatcher(spec);
  } else if (isFunction(spec)) {
    return spec;
  } else {
    return node => node === spec;
  }
}

function buildObjectMatcher(object) {
  let requiredKeys = Object.keys(object).sort();
  let matchers = requiredKeys.map(key => compileMatcher(object[key]));

  return (node, context) => {
    if (!node || typeof node !== 'object') return false;
    let actualKeys = Object.keys(node).sort();
    if (!arrayEqual(requiredKeys, actualKeys)) return false;
    return matchAll(context, matchers, requiredKeys.map(key => node[key]));
  };
}

function buildArrayMatcher(spec) {
  let matchers = spec.map(value => compileMatcher(value));
  return (node, context) => isArray(node) && matchAll(context, matchers, node);
}

function arrayEqual(left, right) {
  if (left.length !== right.length) return false;
  for (let i = 0, len = left.length; i < len; i++) {
    if (left[i] !== right[i]) return false;
  }
  return true;
}

function matchAll(context, matchers, values) {
  if (matchers.length !== values.length) return false;

  let provisionalContext = context.createProvisionalContext();
  for (let i = 0, len = matchers.length; i < len; i++) {
    if (!matchers[i](values[i], provisionalContext)) return false;
  }
  provisionalContext.commit();

  return true;
}
