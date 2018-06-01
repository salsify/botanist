export default function flattenPrototype<T>(object: T): T {
  let flattened = Object.create(null);
  for (let key in object) {
    flattened[key] = object[key];
  }
  return flattened;
}
