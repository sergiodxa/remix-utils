import {
  ActionFunction,
  HeadersFunction,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from 'remix';

export * from './client-only';
export * from './csrf';
export * from './outlet';
export * from './parse-body';
export * from './responses';
export * from './use-hydrated';
export * from './use-should-hydrate';

export type LoaderArgs = Parameters<LoaderFunction>[0];
export type ActionArgs = Parameters<ActionFunction>[0];
export type LinksArgs = Parameters<LinksFunction>[0];
export type MetaArgs = Parameters<MetaFunction>[0];
export type HeadersArgs = Parameters<HeadersFunction>[0];

export type LoaderReturn = ReturnType<LoaderFunction>;
export type ActionReturn = ReturnType<ActionFunction>;
export type LinksReturn = ReturnType<LinksFunction>;
export type MetaReturn = ReturnType<MetaFunction>;
export type HeadersReturn = ReturnType<HeadersFunction>;
