import { applyRules, extractRules, memoizeRule, compileRule, Rule, RULES } from './rules';
import { CapturedValues, MatchedValue } from './types';

export { simple, match, sequence, subtree, choice } from './binding-matchers';
export { default as rest } from './rest';

export { Rule } from './rules';
export { Matcher } from './compile-matcher';
export { default as Context } from './context';

export function transform<Options>(ruleSpecs: Array<Rule<Options>> | { [RULES]: Array<Rule<Options>> }):
  undefined extends Options
    ? (node: any, options?: Options) => any
    : (node: any, options: Options) => any
{
  let rules = extractRules(ruleSpecs);
  let fn = (node: any, options: Options) => applyRules(node, rules, options);
  return fn as any;
}

export function rule<Spec, Options = any>(spec: Spec, transformFunction: (vars: CapturedValues<Spec>, options: Options, node: MatchedValue<Spec>) => any): Rule<Options>;
export function rule(spec: any): (target: Object, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export function rule(spec: any, transformFunction?: (...args: any[]) => void) {
  if (transformFunction) {
    return compileRule(spec, transformFunction);
  } else {
    return (target: Object, key: string, descriptor: PropertyDescriptor) => {
      memoizeRule(target, key, spec);
      return descriptor;
    };
  }
}
