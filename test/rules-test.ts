import { describe, it } from 'mocha';
import { assert } from 'chai';
import { spy } from 'sinon';

import { applyRules, extractRules, memoizeRule, Rule } from '../src/rules';
import Context from '../src/context';

describe('rules', () => {
  it('can be applied based on their matcher and transform functions', () => {
    let object = {
      a: [1, 2],
      b: { flag: true }
    };

    let rules: Array<Rule<void>> = [
      { match: (node: any) => 'length' in node, transform: () => [2, 1] },
      { match: (node: any) => 'flag' in node, transform: () => ({ flag: false }) },
      { match: (node: any) => 'a' in node, transform: (_bound, _options, { a, b }) => ({ a: b, b: a }) }
    ];

    assert.deepEqual(applyRules(object, rules, undefined), {
      b: [2, 1],
      a: { flag: false }
    });
  });

  it('matches prototype behavior for input objects', () => {
    let standard = { key: [1, 2, 3] };
    let prototypeless = Object.assign(Object.create(null), standard);

    assert.equal(Object.getPrototypeOf(applyRules(standard, [], undefined)), Object.prototype);
    assert.equal(Object.getPrototypeOf(applyRules(prototypeless, [], undefined)), null);
  });

  it('can be recorded on and extracted from an object', () => {
    let context = new Context();
    let rootRule = { flipKeys: spy() };
    let flipKeysMatcher = spy();
    memoizeRule(rootRule, 'flipKeys', flipKeysMatcher);

    let childRules = {
      swapPair: spy(),
      toggleFlag: spy()
    };

    let swapPairMatcher = spy();
    let toggleFlagMatcher = spy();
    memoizeRule(childRules, 'swapPair', swapPairMatcher);
    memoizeRule(childRules, 'toggleFlag', toggleFlagMatcher);

    let [flipKeys, swapPair, toggleFlag, ...rest] = extractRules([rootRule, childRules]);
    assert.equal(rest.length, 0);

    flipKeys.match(1, context);
    assert.ok(flipKeysMatcher.calledWith(1));
    flipKeys.transform(2, null, null);
    assert.ok(rootRule.flipKeys.calledWith(2));

    swapPair.match(3, context);
    assert.ok(swapPairMatcher.calledWith(3));
    swapPair.transform(4, null, null);
    assert.ok(childRules.swapPair.calledWith(4));

    toggleFlag.match(5, context);
    assert.ok(toggleFlagMatcher.calledWith(5));
    toggleFlag.transform(6, null, null);
    assert.ok(childRules.toggleFlag.calledWith(6));
  });
});
