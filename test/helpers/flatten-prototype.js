export default function flattenPrototype(object) {
  let flattened = Object.create(null);
  for (let key in object) {
    flattened[key] = object[key];
  }
  return flattened;
}
