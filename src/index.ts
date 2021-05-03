import {
  json as remixJson,
  redirect,
  ActionFunction,
  HeadersFunction,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
  Request,
  ResponseInit,
  Response,
} from 'remix';

export function redirectBack(
  request: Request,
  { fallback, ...init }: ResponseInit & { fallback: string }
): Response {
  return redirect(request.headers.get('Referer') ?? fallback, init);
}

export function parseBody(request: Request): Promise<URLSearchParams> {
  return request.text().then(body => new URLSearchParams(body));
}

export function json<Data = unknown>(data: Data, init?: number | ResponseInit) {
  return remixJson(data, init);
}

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
