import { describe, it } from 'mocha';
import { assert } from 'chai';

import flattenPrototype from './helpers/flatten-prototype';

import { simple, rest } from '../src/index';
import Context from '../src/context';
import compileMatcher from '../src/compile-matcher';

describe('compile-matcher', () => {
  it('can compile a null matcher', () => {
    let match = compileMatcher(null);
    let ctx = new Context();
    assert.ok(match(null, ctx));
    assert.notOk(match(undefined, ctx));
    assert.notOk(match(false, ctx));
  });

  it('can compile a boolean matcher', () => {
    let match = compileMatcher(false);
    let ctx = new Context();
    assert.ok(match(false, ctx));
    assert.notOk(match(true, ctx));
    assert.notOk(match(null, ctx));
  });

  it('can compile a number matcher', () => {
    let match = compileMatcher(3);
    let ctx = new Context();
    assert.ok(match(3, ctx));
    assert.notOk(match(1, ctx));
    assert.notOk(match('3', ctx));
  });

  it('can compile a string matcher', () => {
    let match = compileMatcher('5');
    let ctx = new Context();
    assert.ok(match('5', ctx));
    assert.notOk(match('hello', ctx));
    assert.notOk(match(5, ctx));
  });

  it('can handle a precompiled matcher', () => {
    let match = compileMatcher((item: any) => item === 5);
    let ctx = new Context();
    assert.ok(match(5, ctx));
    assert.notOk(match(10, ctx));
  });

  it('can compile an exact array matcher', () => {
    let match = compileMatcher([1, true, 'three']);
    assert.ok(match([1, true, 'three'], new Context()));
    assert.notOk(match([1, false, 'three'], new Context()));
  });

  it('can compile a binding array matcher', () => {
    let match = compileMatcher([simple('first'), simple('second'), 3]);
    let successContext = new Context();
    assert.ok(match([1, 2, 3], successContext));
    assert.deepEqual(flattenPrototype(successContext.expose()), { first: 1, second: 2 });

    let failureContext = new Context();
    assert.notOk(match([1, 2, 4], failureContext));
    assert.deepEqual(flattenPrototype(failureContext.expose()), {});
  });

  it('can compile a unifying array matcher', () => {
    let match = compileMatcher([simple('x'), simple('y'), simple('x')]);
    let successContext = new Context();
    assert.ok(match([1, 2, 1], successContext));
    assert.deepEqual(flattenPrototype(successContext.expose()), { x: 1, y: 2 });

    let failureContext = new Context();
    assert.notOk(match([1, 2, 3], failureContext));
    assert.deepEqual(flattenPrototype(failureContext.expose()), {});
  });

  it('can compile an array matcher with a rest matcher', () => {
    let match = compileMatcher([simple('x'), ...rest('remainder')]);
    let successContext = new Context();
    assert.ok(match([1, 2, 3], successContext));
    assert.deepEqual(flattenPrototype(successContext.expose()), { x: 1, remainder: [2, 3] });

    let failureContext = new Context();
    assert.notOk(match([{}, 2, 3], failureContext));
    assert.deepEqual(flattenPrototype(failureContext.expose()), {});
  });

  it('can compile an array matcher with an unbound rest matcher', () => {
    let match = compileMatcher([simple('x'), ...rest()]);
    let successContext = new Context();
    assert.ok(match([1, 2, 3], successContext));
    assert.deepEqual(flattenPrototype(successContext.expose()), { x: 1 });

    let failureContext = new Context();
    assert.notOk(match([{}, 2, 3], failureContext));
    assert.deepEqual(flattenPrototype(failureContext.expose()), {});
  });

  it('can compile an exact object matcher', () => {
    let match = compileMatcher({ foo: 1, bar: true, baz: 'three' });
    let context = new Context();
    assert.ok(match({ foo: 1, bar: true, baz: 'three' }, context));
    assert.notOk(match({ foo: 1, bar: false, baz: 'three' }, context));
  });

  it('can compile a binding object matcher', () => {
    let match = compileMatcher({ foo: simple('foo'), bar: true, baz: simple('baz') });
    let successContext = new Context();
    assert.ok(match({ foo: 'beginning', bar: true, baz: 'end' }, successContext));
    assert.deepEqual(flattenPrototype(successContext.expose()), { foo: 'beginning', baz: 'end' });

    let failureContext = new Context();
    assert.notOk(match({ foo: 'beginning', bar: false, baz: 'end' }, failureContext));
    assert.deepEqual(flattenPrototype(failureContext.expose()), {});
  });

  it('can compile a unifying object matcher', () => {
    let match = compileMatcher({ foo: simple('x'), bar: simple('y'), baz: simple('x') });
    let successContext = new Context();
    assert.ok(match({ foo: 1, bar: 2, baz: 1 }, successContext));
    assert.deepEqual(flattenPrototype(successContext.expose()), { x: 1, y: 2 });

    let failureContext = new Context();
    assert.notOk(match({ foo: 1, bar: 2, baz: 3 }, failureContext));
    assert.deepEqual(flattenPrototype(failureContext.expose()), {});
  });

  it('can compile an object matcher with a rest matcher', () => {
    let match = compileMatcher({ foo: simple('x'), ...rest('remainder') });
    let successContext = new Context();
    assert.ok(match({ foo: 1, bar: 2, baz: 3 }, successContext));
    assert.deepEqual(flattenPrototype(successContext.expose()), { x: 1, remainder: { bar: 2, baz: 3 } });
    assert.equal(successContext.expose().remainder.toString(), '[object Object]');

    let failureContext = new Context();
    assert.notOk(match({ bar: 2, baz: 3 }, failureContext));
    assert.deepEqual(flattenPrototype(failureContext.expose()), {});
  });

  it('can compile an object matcher with an unbound rest matcher', () => {
    let match = compileMatcher({ foo: simple('x'), ...rest() });
    let successContext = new Context();
    assert.ok(match({ foo: 1, bar: 2, baz: 3 }, successContext));
    assert.deepEqual(flattenPrototype(successContext.expose()), { x: 1 });

    let failureContext = new Context();
    assert.notOk(match({ bar: 2, baz: 3 }, failureContext));
    assert.deepEqual(flattenPrototype(failureContext.expose()), {});
  });
});
