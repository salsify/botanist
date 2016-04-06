import { describe, it } from 'mocha';
import { assert } from 'chai';
import sinon from 'sinon';

import { applyRules, extractRules, memoizeRule } from '../lib/rules';

describe('rules', () => {
  it('can be applied based on their matcher and transform functions', () => {
    let object = {
      a: [1, 2],
      b: { flag: true }
    };

    let rules = [
      { match: node => 'length' in node, transform: () => [2, 1] },
      { match: node => 'flag' in node, transform: () => ({ flag: false }) },
      { match: node => 'a' in node, transform: (bound, options, { a, b }) => ({ a: b, b: a }) }
    ];

    assert.deepEqual(applyRules(object, rules), {
      b: [2, 1],
      a: { flag: false }
    });
  });

  it('can be recorded on and extracted from an object', () => {
    let rootRule = { flipKeys: sinon.spy() };
    let flipKeysMatcher = sinon.spy();
    memoizeRule(rootRule, 'flipKeys', flipKeysMatcher);

    let childRules = {
      swapPair: sinon.spy(),
      toggleFlag: sinon.spy()
    };

    let swapPairMatcher = sinon.spy();
    let toggleFlagMatcher = sinon.spy();
    memoizeRule(childRules, 'swapPair', swapPairMatcher);
    memoizeRule(childRules, 'toggleFlag', toggleFlagMatcher);

    let [flipKeys, swapPair, toggleFlag, ...rest] = extractRules([rootRule, childRules]);
    assert.equal(rest.length, 0);

    flipKeys.match(1);
    assert.ok(flipKeysMatcher.calledWith(1));
    flipKeys.transform(2);
    assert.ok(rootRule.flipKeys.calledWith(2));

    swapPair.match(3);
    assert.ok(swapPairMatcher.calledWith(3));
    swapPair.transform(4);
    assert.ok(childRules.swapPair.calledWith(4));

    toggleFlag.match(5);
    assert.ok(toggleFlagMatcher.calledWith(5));
    toggleFlag.transform(6);
    assert.ok(childRules.toggleFlag.calledWith(6));
  });
});
