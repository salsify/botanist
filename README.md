# Botanist [![Build Status](https://travis-ci.org/salsify/botanist.svg?branch=master)](https://travis-ci.org/salsify/botanist)

A JavaScript DSL for taming tree structures using rules about the parts they're composed from. Inspired by Parslet's [Transforms](http://kschiess.github.io/parslet/transform.html), Botanist allows you to define a transformation over arbitrarily complex data by describing the structure of the specific constituents that you're interested in.

## Getting Started

A Botanist **transform** is composed of one or more **rules**. Each rule declares the structure it intends to match and a function to be called any time a matching structure is found. Note that this sequence of examples uses the proposed [decorator syntax](https://github.com/wycats/javascript-decorators) for declaring rules, but if you'd prefer plain old ES5, examples of how to do that are [further below](#usage-without-decorators).

### Hello, World

Let's start with nearly the simplest possible rule. We'd like to match any object with a single key `message` whose value is `'hello'`. If we find such an object, we'd like to expand the scope of that message to address the entire world.

```js
import { transform, rule } from 'botanist';

let myFirstTransform = transform({
  @rule({ message: 'hello' })
  expandHorizons() {
    return { message: 'hello', scope: 'world' }};
  }
});

myFirstTransform({ message: 'hello' });
// => { message: 'hello', scope: 'world' }

myFirstTransform({});
// => {}

myFirstTransform({ message: 'hello', irrelevant: true });
// => { message: 'hello', irrelevant: true }

myFirstTransform({ deeply: { nested: { message: 'hello' } } });
// => { deeply: { nested: { message: 'hello', scope: 'world' } } }
```

Some important things to keep in mind about rules:
 - `expandHorizons()` could have been called anything, but picking a method name that describes what the rule does can be helpful for readability and testing
 - anything that doesn't match a rule will come out the other side untouched
 - an object-based rule will only apply to an object with exactly the same keys as the rule itself
 - rules can also match based on the contents of arrays (e.g. `@rule([1, 2, 3])`)
 - a single rule can apply to multiple different substructures in one transformation

### Capturing Data

While there are plenty of scenarios where we may know the exact structure we'd like to match, what about cases where we only know part of it? For this, Botanist supplies a set of **matchers** which can match and capture data in positions where you don't necessarily know what's going to appear. The simplest matcher is (shockingly) called `simple`. It will match any JavaScript primitive like a number or string, and pass it through to the rule's function using the given name.

```js
import { transform, rule, simple } from 'botanist';

let doMath = transform({
  @rule({ op: 'add', lhs: simple('left'), rhs: simple('right') })
  add({ left, right }) {
    return left + right;
  },

  @rule({ op: 'sub', lhs: simple('left'), rhs: simple('right') })
  subtract({ left, right }) {
    return left - right;
  }
});

doMath({ op: 'add', lhs: 1, rhs: 2 });
// => 3

doMath({ op: 'sub', lhs: { op: 'add', lhs: 2, rhs: 2 }, rhs: 1 });
// => 3

doMath({ op: 'add', lhs: [1, 2], rhs: 3 });
// => { op: 'add', lhs: [1, 2], rhs: 3 }
```

Note that you may bind two different fields in a single rule to the same name. If you do so, the rule will only be considered to match if both fields have the same value (according to `===`).

More information about `simple` and the other available matchers can be found in a [dedicated section](#available-matchers) below.

### Rule Interactions

Rules are applied in the order given, so if two rules could both match the same object, the first one will "win" and be applied. Rules are also applied from the bottom up, so all properties of an object will be considered and potentially transformed before the object itself is evaluated.

```js
import { transform, rule, simple, sequence } from 'botanist';

let makeValueJudgments = transform({
  @rule([simple('first'), simple('second'), simple('third')])
  shoutItOut({ first, second, third }) {
    return [first, second, third].map(item => item.toUpperCase());
  },

  @rule({ value: 42 })
  handleSpecialValue() {
    return 'special';
  },

  @rule({ value: simple('value') })
  handleBoringValue({ value }) {
    return `ordinary (${value})`;
  }
});

makeValueJudgments([
  { value: 1 },
  { value: 42 },
  { value: 100 }
]);
// => ['ORDINARY (1)', 'SPECIAL', 'ORDINARY (100)']
```

## Available Matchers
### `simple(name)`
The `simple` matcher will bind any JS primitive or custom class instance to the given name. It may seem strange that custom classes are considered "simple", but since Botanist only traverses down through arrays and POJOs by design, instances of `MyClass` are treated as terminal "leaf" nodes.

Many use cases for Botanist involve taking a JSON-compatible object and either distilling it down to a simpler encoding such as a string, or building it into a richer one, such as a hierarchy of complex objects with their own methods and prototype chains. Because of this, matching on `simple` subtrees is a way to help catch bugs in your transform early, since a deep JSON object that no rule matches will ripple its "non simpleness" back up to the top, preventing any of its ancestors from matching as well and making it clear where the problem was introduced.

#### Sample Values `simple` Will Match
- `null`
- `undefined`
- `false`
- `87`
- `'hello'`
- `new MyClass()`

#### Sample Values `simple` Will Not Match
- `[1, 2, 3]`
- `{ x: 1, y: 2 }`
- `[]`
- `{}`

### `choice(options, name)`
The `choice` matcher will bind any `simple` value that is present in a given list of options.

#### Sample Values `choice` Will Match
- `choice([1, 2, 3])`
  - `1`
  - `2`
  - `3`
- `choice(['hello'])`
  - `'hello'`

#### Sample Values `choice` Will Not Match
- `choice([1, 2, 3])`
  - `4`
  - `'1'`
- `choice([null, false])`
  - `undefined`
  - `''`
  - `[]`
- `choice([])`
  - `null`
  - `undefined`
  - `''`
  - `[]`

### `sequence(name)`
The `sequence` matcher will bind an array of `simple` elements to the given name.

#### Sample Values `sequence` Will Match
- `[1, 2, 3]`
- `['hi', false, new MyClass()]`
- `[]`

#### Sample Values `sequence` Will Not Match
- `[{}]`
- `[[1, 2, 3]]`
- `{}`
- `'sequence'`

### `match(regex, name)`
The `match` matcher accepts a regular expression, and will bind an array of captured strings to the given name. The final element of the array will be the full matched string.

#### Sample Values `match` Will Match
- `match(/foo(bar|baz)/)`
  - `'foobar'` => `['bar', 'foobar']`
  - `'foobaz'` => `['baz', 'foobaz']`
  - `'abcfoobardef'` => `['bar', 'foobar']`
- `match(/\d+/)`
  - `'123'` => `['123']`
  - `123` => `['123']`
- `match(/.*/)`
  - `undefined` => `['undefined']`
  - `null` => `['null']`
  - `true` => `['true']`
  - `new MyClass()` => `['[object Object]']`

Note that `match` will coerce any `simple` value to a string before evaluating whether or not it matches the given regular expression.

#### Sample Values `match` Will Not Match
- `match(/foo(bar|baz)/)`
  - `''`
  - `'qux'`
- `match(/.*/)`
  - `[]`
  - `{}`

### `subtree(name)`
The `subtree` matcher binds any value to the given name, including arrays and POJOs. Use with caution, as this escape valve has the potential to be a footgun.

## Transform Options
When running a transform, you can pass a second argument if you want to be able to customize its behavior. This value will be exposed to every rule function as it executes.

```js
let replaceNames = transform({
  @rule({ name: simple('name') })
  replaceName({ name }, replacements = {}) {
    return { name: replacements[name] || name };
  }
});

let people = [
  { name: 'Alice' },
  { name: 'Bob' }
];

replaceNames(people);
// => [{ name: 'Alice' }, { name: 'Bob' }]

replaceNames(people, { Bob: 'Barbara' });
// => [{ name: 'Alice' }, { name: 'Barbara' }]

replaceNames(people, { Alice: 'Alex', Bob: 'Brad' });
// => [{ name: 'Alex' }, { name: 'Brad' }]
```

## Modularity and Composition

Rather than a single object with rules, `transform` will also accept an array of such objects. In this way, you have the option of packaging up your rules into smaller logical groups that you can develop and test individually.

Then, you can compose all those sets of rules together to produce your final transformation function. Note that, just like with a single object, rules will be tested in the order given.

## Usage Without Decorators

If you wish to use Botanist in an ES5 environment (or you just don't like having to come up with names for your rules), everything documented above will also work if you treat `rule` as a regular function and just pass a second argument representing the rule's behavior.

Revisiting our math example from earlier:

```js
var botanist = require('botanist');
var simple = botanist.simple;
var rule = botanist.rule;

var doMath = botanist.transform([
  rule({ op: 'add', lhs: simple('left'), rhs: simple('right') }, function(values) {
    return values.left + values.right;
  }),

  rule({ op: 'sub', lhs: simple('left'), rhs: simple('right') }, function(values) {
    return values.left - values.right;
  })
]);

doMath({ op: 'add', lhs: 1, rhs: 2 });
// => 3

doMath({ op: 'sub', lhs: { op: 'add', lhs: 2, rhs: 2 }, rhs: 1 });
// => 3

doMath({ op: 'add', lhs: [1, 2], rhs: 3 });
// => { op: 'add', lhs: [1, 2], rhs: 3 }
```
