import { isArray, isObject, isFunction } from './utils';
import { OBJECT_REST, ARRAY_REST } from './rest';

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

function buildObjectMatcher(spec) {
  let specKeys = Object.keys(spec).filter(key => key !== OBJECT_REST).sort();
  let matchers = specKeys.map(key => compileMatcher(spec[key]));

  return (node, context) => {
    if (!node || typeof node !== 'object') return false;

    let allKeys = Object.keys(node);
    let requiredKeys = allKeys.filter(key => key in spec).sort();

    if (!(allKeys.length === requiredKeys.length || OBJECT_REST in spec)) return false;

    if (matchAll(context, matchers, requiredKeys.map(key => node[key]))) {
      let restName = spec[OBJECT_REST];
      if (restName) {
        return context.bind(restName, extractObjectRest(spec, node, allKeys));
      } else {
        return true;
      }
    }
  };
}

function buildArrayMatcher(spec) {
  let { items, restSigil } = normalizeArraySpec(spec);
  let matchers = items.map(value => compileMatcher(value));

  return (node, context) => {
    if (!isArray(node)) return false;

    let requiredItems = restSigil ? node.slice(0, matchers.length) : node;
    if (matchAll(context, matchers, requiredItems)) {
      if (restSigil && restSigil[ARRAY_REST]) {
        return context.bind(restSigil[ARRAY_REST], node.slice(matchers.length));
      } else {
        return true;
      }
    }
  };
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

function extractObjectRest(spec, node, keys) {
  let result = {};
  keys.forEach((key) => {
    if (!(key in spec)) {
      result[key] = node[key];
    }
  });
  return result;
}

function normalizeArraySpec(spec) {
  let items = spec;
  let restSigil = null;

  let lastItem = items[spec.length - 1];
  if (isObject(lastItem) && ARRAY_REST in lastItem) {
    items = items.slice(0, -1);
    restSigil = lastItem;
  }

  return { items, restSigil };
}
