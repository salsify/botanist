import { describe, it } from 'mocha';
import { assert } from 'chai';

import flattenPrototype from './helpers/flatten-prototype';
import Context from '../lib/context';
import { simple, sequence, match, subtree } from '../lib/binding-matchers';

describe('Binding matchers', () => {
  describe('simple()', () => {
    it('accepts the right stuff', () => {
      assertMatch(simple, null);
      assertMatch(simple, undefined);
      assertMatch(simple, false);
      assertMatch(simple, true);
      assertMatch(simple, 'hello');
      assertMatch(simple, 87);
      assertMatch(simple, new class {});
    });

    it('rejects the right stuff', () => {
      assertNoMatch(simple, [1, 2, 3]);
      assertNoMatch(simple, { x: 1, y: 2 });
      assertNoMatch(simple, []);
      assertNoMatch(simple, {});
    });
  });

  describe('sequence()', () => {
    it('accepts the right stuff', () => {
      assertMatch(sequence, [1, 2, 3]);
      assertMatch(sequence, ['hi', false, new class {}]);
      assertMatch(sequence, []);
      assertMatch(sequence, [null]);
    });

    it('rejects the right stuff', () => {
      assertNoMatch(sequence, null);
      assertNoMatch(sequence, 'sequence');
      assertNoMatch(sequence, [{}]);
      assertNoMatch(sequence, [[]]);
      assertNoMatch(sequence, [[1, 2, 3]]);
    });
  });

  describe('match()', () => {
    let matchRegex = regex => name => match(regex, name);

    it('accepts the right stuff', () => {
      assertMatch(matchRegex(/b/), 'abc', ['b']);
      assertMatch(matchRegex(/abc/), 'abc', ['abc']);
      assertMatch(matchRegex(/\d+/), 123, ['123']);
      assertMatch(matchRegex(/a(b|c)d/), 'abd', ['b', 'abd']);
      assertMatch(matchRegex(/a(b|c)d/), 'acd', ['c', 'acd']);
      assertMatch(matchRegex(/(a(bc(de)f))(g)/), 'abcdefg', ['abcdef', 'bcdef', 'de', 'g', 'abcdefg']);
      assertMatch(matchRegex(/.*/), undefined, ['undefined']);
      assertMatch(matchRegex(/.*/), null, ['null']);
      assertMatch(matchRegex(/.*/), true, ['true']);
      assertMatch(matchRegex(/.*/), new class {}, ['[object Object]']);
      assertMatch(matchRegex(/.*/), new class { toString() { return 'hi'; } }, ['hi']);
    });

    it('rejects the right stuff', () => {
      assertNoMatch(matchRegex(/.*/), {});
      assertNoMatch(matchRegex(/.*/), []);
      assertNoMatch(matchRegex(/foo/), '');
      assertNoMatch(matchRegex(/abc/), null);
      assertNoMatch(matchRegex(/^abc$/), 'abcd');
    });
  });

  describe('subtree()', () => {
    it('accepts anything', () => {
      assertMatch(subtree, null);
      assertMatch(subtree, undefined);
      assertMatch(subtree, false);
      assertMatch(subtree, true);
      assertMatch(subtree, 'hello');
      assertMatch(subtree, 87);
      assertMatch(subtree, new class {});
      assertMatch(subtree, [1, 2, 3]);
      assertMatch(subtree, { x: 1, y: 2 });
      assertMatch(subtree, []);
      assertMatch(subtree, {});
    });
  });
});

function assertMatch(matcher, node, boundValue) {
  let context = new Context();
  assert.ok(matcher('binding')(node, context));

  let env = flattenPrototype(context.expose());
  if (boundValue) {
    assert.deepEqual(env, { binding: boundValue });
  } else {
    assert.equal(Object.keys(env).length, 1);
    assert.equal(env.binding, node);
  }
}

function assertNoMatch(matcher, node) {
  let context = new Context();
  assert.notOk(matcher('binding')(node, context));

  let env = flattenPrototype(context.expose());
  assert.deepEqual(env, {});
}
