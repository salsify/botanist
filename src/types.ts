import { Matcher } from './compile-matcher';
import { OBJECT_REST } from './rest';

/**
 * An object type mapping all captured identifiers from a rule spec to their
 * corresponding types, e.g.
 *
 *    spec = { foo: match(/bar/, 'regex') };
 *    CapturedValues<typeof spec> ::= { regex: string[] };
 *
 *    spec = { foo: sequence('array'), bar: { baz: subtree('tree') } };
 *    CapturedValues<typeof spec> ::= { array: any[], tree: any };
 */
export type CapturedValues<T> = FindCapturedValues<T>['__captured__'];

/**
 * An object type describing the shape a given rule spec will match, e.g.
 *
 *    spec = { foo: match(/bar/, 'regex') };
 *    MatchedValue<typeof spec> ::= { foo: any };
 *
 *    spec = { foo: sequence('array'), bar: { baz: subtree('tree') } };
 *    MatchedValue<typeof spec> ::= { foo: any[], bar: { baz: any } };
 */
export type MatchedValue<T> = FindMatchedValue<T>['__matched__'];

// The actual implementation for `CapturedValues<T>`; the `__captured__` wrapper
// is necessary to keep TS happy with our sneaky recursive type.
type FindCapturedValues<T>
  = T extends [infer A, infer B, infer C, infer D] ? { __captured__: CapturedValues<A> & CapturedValues<B> & CapturedValues<C> & CapturedValues<D> }
  : T extends [infer A, infer B, infer C] ? { __captured__: CapturedValues<A> & CapturedValues<B> & CapturedValues<C> }
  : T extends [infer A, infer B] ? { __captured__: CapturedValues<A> & CapturedValues<B> }
  : T extends [infer A] ? { __captured__: CapturedValues<A> }
  : T extends Array<infer V> ? { __captured__: CapturedValues<V> }
  : T extends Matcher<infer Mappings> ? { __captured__: Mappings }
  : T extends { [key: string]: any } ? { __captured__: MergeCapturedMappings<FlattenCapture<T>> }
  : { __captured__: {} };

// A union of the types of all values in a hash
type Values<T> = T[keyof T];

// Ensures that all values in the given hash type are themselves `CapturedValues` mappings
// in order for us to union them all together.
type FlattenCapture<T> = { [Key in keyof T]: CapturedValues<T[Key]> };

// Given a `FlattenCapture` type, returns a union of all captured names
type CapturedNames<T> = Extract<Values<{ [Key in keyof T]: keyof T[Key] }>, string>;

// Given a `FlattenCapture` type, determines the type for the captured value of the given name, e.g.
//    type Flattened = { a: { foo: string }, b: { foo: number, bar: symbol } };
//    CapturedType<Flattened, 'foo'> ::= string | number
type CapturedType<Obj, Name extends string> = Extract<Values<Obj>, { [name in Name]: any }> extends { [name in Name]: infer T } ? T : never

// Given a `FlattenCapture` type, unions together all the captured mappings nested within it
type MergeCapturedMappings<Obj> = { [Name in CapturedNames<Obj>]: CapturedType<Obj, Name> };

// The actual implementation for `MatchedValue<T>`; the `__matched__` wrapper
// is necessary to keep TS happy with our sneaky recursive type.
type FindMatchedValue<T>
  = T extends [infer A, infer B, infer C, infer D] ? { __matched__: [MatchedValue<A>, MatchedValue<B>, MatchedValue<C>, MatchedValue<D>] }
  : T extends [infer A, infer B, infer C] ? { __matched__: [MatchedValue<A>, MatchedValue<B>, MatchedValue<C>] }
  : T extends [infer A, infer B] ? { __matched__: [MatchedValue<A>, MatchedValue<B>] }
  : T extends [infer A] ? { __matched__: [MatchedValue<A>] }
  : T extends { [OBJECT_REST]: any } ? { __matched__: MatchedValue<{ [K in Exclude<keyof T, typeof OBJECT_REST>]: T[K] }> }
  : T extends Matcher<infer Mappings, infer MatchTypes> ? { __matched__: Values<MatchTypes> }
  : T extends Array<infer V> ? { __matched__: Array<MatchedValue<V>> }
  : T extends { [key: string]: any } ? { __matched__: { [K in keyof T]: MatchedValue<T[K]> } }
  : { __matched__: T };
