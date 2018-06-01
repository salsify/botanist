import { Matcher } from './compile-matcher';
import { OBJECT_REST } from './rest';

// The __foo__ indirection is required to keep TS happy with our sneaky recursive types
export type CapturedValues<T> = FindCapturedValues<T>['__captured__'];
export type MatchedValue<T> = FindMatchedValue<T>['__matched__'];

type FindCapturedValues<T>
  = T extends [infer A, infer B, infer C, infer D] ? { __captured__: CapturedValues<A> & CapturedValues<B> & CapturedValues<C> & CapturedValues<D> }
  : T extends [infer A, infer B, infer C] ? { __captured__: CapturedValues<A> & CapturedValues<B> & CapturedValues<C> }
  : T extends [infer A, infer B] ? { __captured__: CapturedValues<A> & CapturedValues<B> }
  : T extends [infer A] ? { __captured__: CapturedValues<A> }
  : T extends Array<infer V> ? { __captured__: CapturedValues<V> }
  : T extends Matcher<infer Mappings> ? { __captured__: Mappings }
  : T extends { [key: string]: any } ? { __captured__: ExtractObjectCapture<FlattenCapture<T>> }
  : { __captured__: {} };

type Values<T> = T[keyof T];

type FlattenCapture<T> = { [Key in keyof T]: CapturedValues<T[Key]> };

type CapturedNames<T> = Extract<Values<{ [Key in keyof T]: keyof T[Key] }>, string>;

type ExtractObjectCapture<Obj> = {
  [Name in CapturedNames<Obj>]: Extract<Obj[keyof Obj], { [name in Name]: any }> extends { [name in Name]: infer T } ? T : never
};

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
