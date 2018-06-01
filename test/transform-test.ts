import { describe, it } from 'mocha';
import { assert } from 'chai';
import { transform as babelTransform } from 'babel-core';

// @ts-ignore: no typings
import decoratorsPlugin from 'babel-plugin-transform-decorators-legacy';

import { transform, rule, simple, sequence, match, choice, subtree } from '../src/index';

describe('ASTTransform', () => {
  it('handles exact matchers', () => {
    let testTransform = transform([
      rule({ x: true, y: { z: [1, 2, 3] } }, () => 'ok')
    ]);

    let match = { x: true, y: { z: [1, 2, 3] } };
    assert.equal(testTransform(match), 'ok');

    let nonMatch = { x: true, y: { z: [1, 2] } };
    assert.deepEqual(testTransform(nonMatch), nonMatch);
  });

  it('passes through given options', () => {
    type Options = { xAndYValue: boolean | string, zValue: boolean | string };

    const testTransform = transform<Options>([
      rule({ x: 1, y: 2 }, (_, { xAndYValue }) => xAndYValue),
      rule({ z: 3 }, (_, { zValue }) => zValue)
    ]);

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

  it('passes through the matched node', () => {
    const testTransform = transform([
      rule({ x: sequence() }, (_bound, _options, node) => node.x),
    ]);

    const input = { x: [1, 2, 3] };
    assert.deepEqual(testTransform(input), input.x);
  });

  it('handles simple binding', () => {
    let testTransform = transform([
      rule({ x: simple('foo'), y: simple('bar') }, ({ foo, bar }) => {
        return { foo, bar };
      }),

      rule({ z: simple('z') }, ({ z }) => {
        return { z: z.toUpperCase() };
      })
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

    let partial = { fizz: { x: 'a', y: 'b' } };
    assert.deepEqual(testTransform(partial), {
      fizz: { foo: 'a', bar: 'b' }
    });

    let nonmatch = { left: { x: 1, y: 2, z: 3 }, right: {} };
    assert.deepEqual(testTransform(nonmatch), nonmatch);
  });

  it('handles regex binding', () => {
    let testTransform = transform([
      rule({ x: match(/foo(bar|baz)/, 'string') }, ({ string: [barOrBaz, wholeMatch] }, _, node) => {
        return { wholeMatch, barOrBaz, source: node.x };
      })
    ]);

    assert.deepEqual(testTransform({ x: 'foobaz' }), {
      wholeMatch: 'foobaz',
      barOrBaz: 'baz',
      source: 'foobaz'
    });

    assert.deepEqual(testTransform({ x: 'fooqux' }), {
      x: 'fooqux'
    });
  });

  it('handles choice binding', () => {
    let testTransform = transform([
      rule({ x: choice([1, true, 'three'], 'foo') }, (vars, _, node) => {
        return `${vars.foo} ${node.x}`;
      })
    ]);

    assert.equal(testTransform({ x: 'three' }), 'three three');
    assert.deepEqual(testTransform({ x: '1' }), { x: '1' });
  });

  it('handles sequence binding', () => {
    let testTransform = transform([
      rule({ things: sequence('stuff') }, ({ stuff }) => {
        return stuff.reverse();
      })
    ]);

    let match = { things: [1, 2, 3] };
    assert.deepEqual(testTransform(match), [3, 2, 1]);

    let nonmatch = { things: [1, 2, {}] };
    assert.deepEqual(testTransform(nonmatch), nonmatch);
  });

  it('handles subtree binding', () => {
    let testTransform = transform([
      rule({ type: 'wrapper', content: subtree('wrapped') }, ({ wrapped }) => {
        return wrapped;
      }),

      rule({ type: 'item', value: simple('value') }, ({ value }) => {
        return { value, size: value.length };
      })
    ]);

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

  it('works with a Babel-decorated hash', () => {
    let testTransform = js`
      const { transform, rule, simple } = require('../src/index');

      transform({
        @rule({ op: 'add', lhs: simple('lhs'), rhs: simple('rhs') })
        add({ lhs, rhs }) {
          return lhs + rhs;
        }
      })
    `;

    assert.equal(testTransform({ op: 'add', lhs: 1, rhs: 2 }), 3);
  });

  it('works with an array of Babel-decorated hashes', () => {
    let testTransform = js`
      const { transform, rule, simple } = require('../src/index');

      transform([
        {
          @rule({ op: 'add', lhs: simple('lhs'), rhs: simple('rhs') })
          add({ lhs, rhs }) {
            return lhs + rhs;
          }
        }, {
          @rule({ op: 'sub', lhs: simple('lhs'), rhs: simple('rhs') })
          sub({ lhs, rhs }) {
            return lhs - rhs;
          }
        }
      ])
    `;

    assert.equal(testTransform({ op: 'add', lhs: 1, rhs: { op: 'sub', lhs: 5, rhs: 2 } }), 4);
  });
});

function js([code]: TemplateStringsArray): any {
  let result = babelTransform(code, { plugins: [decoratorsPlugin] });
  return eval(result.code!);
}
