import { json as remixJson, redirect } from 'remix';

/**
 * A wrapper of the `json` function from `remix` which accepts a generic for the
 * data to be serialized. This allows you to use the same type for `json` and
 * on `useRouteData` to ensure the type is always in sync.
 * @example
 * type RouteData = { user: { name: string } };
 * async function loader({ request }: LoaderArgs): Promise<LoaderReturn> {
 *   let user = await getUser(request);
 *   return json<RouteData>({ user });
 * }
 * function View() {
 *   let { user } = useRouteData<RouteData>();
 *   return <UserProfile user={user} />;
 * }
 */
export function json<Data = unknown>(data: Data, init?: number | ResponseInit) {
  return remixJson(data, init);
}

/**
 * Create a new Response with a redirect set to the URL the user was before.
 * It uses the Referer header to detect the previous URL. It asks for a fallback
 * URL in case the Referer couldn't be found, this fallback should be a URL you
 * may be ok the user to land to after an action even if it's not the same.
 * @example
 * async function action({ request }: ActionArgs): Promise<ActionReturn> {
 *   await doSomething(request);
 *   // If the user was on `/search?query=something` we redirect to that URL
 *   // but if we couldn't we redirect to `/search`, which is an good enough
 *   // fallback
 *   return redirectBack(request, { fallback: "/search" });
 * }
 */
export function redirectBack(
  request: Request,
  { fallback, ...init }: ResponseInit & { fallback: string }
): Response {
  return redirect(request.headers.get('Referer') ?? fallback, init);
}

/**
 * Create a response receiving a JSON object with the status code 400.
 * @example
 * async function loader({ request }: LoaderArgs): Promise<LoaderReturn> {
 *   let user = await getUser(request);
 *   return badRequest<RouteData>({ user });
 * }
 */
export function badRequest<Data = unknown>(
  data: Data,
  init?: Omit<ResponseInit, 'status'>
) {
  return json<Data>(data, { ...init, status: 400 });
}

/**
 * Create a response receiving a JSON object with the status code 401.
 * @example
 * async function loader({ request }: LoaderArgs): Promise<LoaderReturn> {
 *   let user = await getUser(request);
 *   return unauthorized<RouteData>({ user });
 * }
 */
export function unauthorized<Data = unknown>(
  data: Data,
  init?: Omit<ResponseInit, 'status'>
) {
  return json<Data>(data, { ...init, status: 401 });
}

/**
 * Create a response receiving a JSON object with the status code 403.
 * @example
 * async function loader({ request }: LoaderArgs): Promise<LoaderReturn> {
 *   let user = await getUser(request);
 *   return forbidden<RouteData>({ user });
 * }
 */
export function forbidden<Data = unknown>(
  data: Data,
  init?: Omit<ResponseInit, 'status'>
) {
  return json<Data>(data, { ...init, status: 403 });
}

/**
 * Create a response receiving a JSON object with the status code 404.
 * @example
 * async function loader({ request }: LoaderArgs): Promise<LoaderReturn> {
 *   let user = await getUser(request);
 *   return notFound<RouteData>({ user });
 * }
 */
export function notFound<Data = unknown>(
  data: Data,
  init?: Omit<ResponseInit, 'status'>
) {
  return json<Data>(data, { ...init, status: 404 });
}

/**
 * Create a response receiving a JSON object with the status code 500.
 * @example
 * async function loader({ request }: LoaderArgs): Promise<LoaderReturn> {
 *   let user = await getUser(request);
 *   return serverError<RouteData>({ user });
 * }
 */
export function serverError<Data = unknown>(
  data: Data,
  init?: Omit<ResponseInit, 'status'>
) {
  return json<Data>(data, { ...init, status: 500 });
}
