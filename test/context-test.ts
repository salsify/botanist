import { describe, it } from 'mocha';
import { assert } from 'chai';

import flattenPrototype from './helpers/flatten-prototype';

import Context from '../src/context';

describe('Context', () => {
  it('exposes simple bindings', () => {
    let context = new Context();
    assert.ok(context.bind('foo', 1));
    assert.ok(context.bind('foo', 1));
    assert.notOk(context.bind('foo', 2));
    assert.deepEqual(flattenPrototype(context.expose()), { foo: 1 });
  });

  it('exposes and can discard provisional bindings', () => {
    let context = new Context();
    assert.ok(context.bind('foo', 1));

    let provisional = context.createProvisionalContext();

    assert.notOk(provisional.bind('foo', 2));
    assert.ok(provisional.bind('bar', 3));

    assert.deepEqual(flattenPrototype(context.expose()), { foo: 1 });
    assert.deepEqual(flattenPrototype(provisional.expose()), { foo: 1, bar: 3 });

    provisional.commit();

    assert.deepEqual(flattenPrototype(context.expose()), { foo: 1, bar: 3 });
  });
});
