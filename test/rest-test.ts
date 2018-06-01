import { describe, it } from 'mocha';
import { assert } from 'chai';

import rest, { OBJECT_REST, ARRAY_REST } from '../src/rest';

describe('rest', () => {
  it('decorates array specs', () => {
    let result = rest([1, 2, 3], 'else');
    assert.deepEqual(result, [1, 2, 3, { [ARRAY_REST]: 'else' }] as any);
  });

  it('decorates object specs', () => {
    let result = rest({ x: 1, y: 2 }, 'else');
    assert.deepEqual(result, { x: 1, y: 2, [OBJECT_REST]: 'else' } as any);
  });

  it('spreads into array specs', () => {
    let result = [1, 2, 3, ...rest('else')];
    assert.deepEqual(result, [1, 2, 3, { [ARRAY_REST]: 'else' }] as any);
  });

  it('spreads into object specs', () => {
    let result = { x: 1, y: 2, ...rest('else') };
    assert.deepEqual(result, { x: 1, y: 2, [OBJECT_REST]: 'else' } as any);
  });
});
