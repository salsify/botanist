import { applyRules, extractRules, memoizeRule, compileRule } from './rules';

export { simple, match, sequence, subtree, choice } from './binding-matchers';

export function transform(ruleSpecs) {
  let rules = extractRules(ruleSpecs);
  return (ast, options) => applyRules(ast, rules, options);
}

export function rule(spec, transformFunction) {
  if (transformFunction) {
    return compileRule(spec, transformFunction);
  } else {
    return (target, key, descriptor) => {
      memoizeRule(target, key, spec);
      return descriptor;
    };
  }
}
