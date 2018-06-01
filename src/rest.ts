import { isString, isObject, isArray } from './utils';
import { CapturedValues } from './types';
import { Matcher } from './compile-matcher';

export default function rest(): Rest<never>;
export default function rest<Name extends string>(name: Name): Rest<Name>;
export default function rest<Name extends string, T extends any[]>(spec: T, name: Name): Matcher<CapturedValues<T> & { [key in Name]: any[] }>
export default function rest<Name extends string, T extends {}>(spec: T, name: Name): Matcher<CapturedValues<T> & { [key in Name]: { [key: string]: any } }>
export default function rest(spec?: any, name?: string) {
  if (isString(spec) || (!spec && !name)) {
    return makeSpreadable(spec);
  } else if (isArray(spec) && name) {
    return [...spec, { [ARRAY_REST]: name }];
  } else if (isObject(spec) && name) {
    return { ...spec, [OBJECT_REST]: name };
  } else {
    throw new Error('Invalid target for rest()');
  }
}

export const OBJECT_REST = '__botanist-object-rest';
export const ARRAY_REST = '__botanist-array-rest';

export type Rest<Name extends string> = {
  [Symbol.iterator]: () => IterableIterator<Matcher<{ [key in Name]: any[] }>>,
  [OBJECT_REST]: Matcher<{ [key in Name]: { [key: string]: any } }>
};

function makeSpreadable(name: string) {
  let spreadable = Object.create([{ [ARRAY_REST]: name }]);
  spreadable[OBJECT_REST] = name;
  return spreadable;
}
