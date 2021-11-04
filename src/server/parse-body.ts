/**
 * Parse the body of a Request to an URLSearchParams instance.
 * @example
 * async function action({ request }: ActionArgs): Promise<ActionReturn> {
 *  const body = await parseBody(request);
 *  await doSomething(body);
 *  return redirect("/target");
 * }
 */
export function parseBody(request: Request): Promise<URLSearchParams> {
  return request.text().then((body) => new URLSearchParams(body));
}

/**
 * Parse the params from parseBody result to an object.
 * @example
 * async function action({ request }: ActionArgs): Promise<ActionReturn> {
 *   const params = parseParams(await parseBody(request));
 *   await doSomething(params);
 *   return redirect("/target");
 * }
 */
export function parseParams<Value extends Record<string, unknown>>(
  params: URLSearchParams
): Value {
  return Object.fromEntries(params.entries()) as Value;
}
