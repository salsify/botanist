import { isString, isObject, isArray } from './utils';

export default function rest(spec, name) {
  if (isString(spec) || (!spec && !name)) {
    return makeSpreadable(spec);
  } else if (isObject(spec)) {
    return { ...spec, [OBJECT_REST]: name };
  } else if (isArray(spec)) {
    return [...spec, { [ARRAY_REST]: name }];
  } else {
    throw new Error('Invalid target for rest()');
  }
}

export const OBJECT_REST = '__botanist-object-rest';
export const ARRAY_REST = '__botanist-array-rest';

function makeSpreadable(name) {
  let spreadable = Object.create([{ [ARRAY_REST]: name }]);
  spreadable[OBJECT_REST] = name;
  return spreadable;
};
