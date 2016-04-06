import { describe, it } from 'mocha';
import { assert } from 'chai';

import { transform, rule, simple, sequence, match, subtree } from '../lib';

describe('ASTTransform', () => {
  it('handles exact matchers', () => {
    let testTransform = transform({
      @rule({ x: true, y: { z: [1, 2, 3] } })
      swapSomeStuff() {
        return 'ok';
      }
    });

    let match = { x: true, y: { z: [1, 2, 3] } };
    assert.equal(testTransform(match), 'ok');

    let nonmatch = { x: true, y: { z: [1, 2] } };
    assert.deepEqual(testTransform(nonmatch), nonmatch);
  });

  it('passes through given options', () => {
    const testTransform = transform({
      @rule({ x: 1, y: 2 })
      xAndY(_, { xAndYValue }) {
        return xAndYValue;
      },

      @rule({ z: 3 })
      z(_, { zValue }) {
        return zValue;
      }
    });

    const input = { left: { x: 1, y: 2 }, right: { z: 3 } };
    assert.deepEqual(testTransform(input, { xAndYValue: true, zValue: false }), {
      left: true,
      right: false
    });

    assert.deepEqual(testTransform(input, { xAndYValue: 'hello', zValue: 'goodbye' }), {
      left: 'hello',
      right: 'goodbye'
    });
  });

  it('handles simple binding', () => {
    let testTransform = transform({
      @rule({ x: simple('foo'), y: simple('bar') })
      xAndY({ foo, bar }) {
        return { foo, bar };
      },

      @rule({ z: simple('z') })
      shoutZ({ z }) {
        return { z: z.toUpperCase() };
      }
    });

    let match = { left: { x: 1, y: 2 }, right: { z: 'hello' } };
    assert.deepEqual(testTransform(match), {
      left: { foo: 1, bar: 2 },
      right: { z: 'HELLO' }
    });

    let partialMatch = { fizz: { x: 'a', y: 'b' } };
    assert.deepEqual(testTransform(partialMatch), {
      fizz: { foo: 'a', bar: 'b' }
    });

    let nonmatch = { left: { x: 1, y: 2, z: 3 }, right: {} };
    assert.deepEqual(testTransform(nonmatch), nonmatch);
  });

  it('operates with rules given with non-decorator syntax', () => {
    let testTransform = transform([
      rule({ x: simple('foo'), y: simple('bar') }, ({ foo, bar }) => ({ foo, bar })),
      rule({ z: simple('z') }, ({ z }) => ({ z: z.toUpperCase() }))
    ]);

    let match = { left: { x: 1, y: 2 }, right: { z: 'hello' } };
    assert.deepEqual(testTransform(match), {
      left: { foo: 1, bar: 2 },
      right: { z: 'HELLO' }
    });

    let partialMatch = { fizz: { x: 'a', y: 'b' } };
    assert.deepEqual(testTransform(partialMatch), {
      fizz: { foo: 'a', bar: 'b' }
    });

    let nonmatch = { left: { x: 1, y: 2, z: 3 }, right: {} };
    assert.deepEqual(testTransform(nonmatch), nonmatch);
  });

  it('handles regex binding', () => {
    let testTransform = transform({
      @rule({ x: match(/foo(bar|baz)/, 'string') })
      extractMatch({ string: [barOrBaz, wholeMatch] }) {
        return { wholeMatch, barOrBaz };
      }
    });

    assert.deepEqual(testTransform({ x: 'foobaz' }), {
      wholeMatch: 'foobaz',
      barOrBaz: 'baz'
    });

    assert.deepEqual(testTransform({ x: 'fooqux' }), {
      x: 'fooqux'
    });
  });

  it('handles sequence binding', () => {
    let testTransform = transform({
      @rule({ things: sequence('stuff') })
      reverse({ stuff }) {
        return stuff.reverse();
      }
    });

    let match = { things: [1, 2, 3] };
    assert.deepEqual(testTransform(match), [3, 2, 1]);

    let nonmatch = { things: [1, 2, {}] };
    assert.deepEqual(testTransform(nonmatch), nonmatch);
  });

  it('handles subtree binding', () => {
    let testTransform = transform({
      @rule({ type: 'wrapper', content: subtree('wrapped') })
      unwrap({ wrapped }) {
        return wrapped;
      },

      @rule({ type: 'item', value: simple('value') })
      countItemCharacters({ value }) {
        return { value, size: value.length };
      }
    });

    let result = testTransform({
      type: 'wrapper',
      content: [
        { type: 'item', value: 'one' },
        { type: 'item', value: 'two' },
        { type: 'item', value: 'three' }
      ]
    });

    assert.deepEqual(result, [
      { value: 'one', size: 3 },
      { value: 'two', size: 3 },
      { value: 'three', size: 5 }
    ]);
  });
});
