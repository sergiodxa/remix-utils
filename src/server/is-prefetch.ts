/**
 * Check if a specific Request is a prefetch request created by using
 * <Link prefetch="intent"> or <Link prefetch="render">.
 *
 * @example
 * export let loader: LoaderFunction = async ({ request }) => {
 *   let data = await getData(request)
 *   let headers = new Headers()
 *   if (isPrefetch(request)) {
 *     headers.set("Cache-Control", "private, max-age=5, smax-age=0")
 *   }
 *   return json(data, { headers })
 * }
 */
export function isPrefetch(request: Request) {
  let purpose =
    request.headers.get("Purpose") ||
    request.headers.get("X-Purpose") ||
    request.headers.get("Sec-Purpose") ||
    request.headers.get("Sec-Fetch-Purpose") ||
    request.headers.get("Moz-Purpose");

  return purpose?.toLowerCase() === "prefetch";
}
