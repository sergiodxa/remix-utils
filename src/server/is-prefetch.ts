/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/is-prefetch`.
 *
 * This function let you identify if a request was created because of a prefetch triggered by using `<Link prefetch="intent">` or `<Link prefetch="render">`.
 *
 * This will let you implement a short cache only for prefetch requests so you [avoid the double data request](https://sergiodxa.com/articles/fix-double-data-request-when-prefetching-in-remix).
 *
 * ```ts
 * import { isPrefetch } from "remix-utils/is-prefetch";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	let data = await getData(request);
 * 	let headers = new Headers();
 *
 * 	if (isPrefetch(request)) {
 * 		headers.set("Cache-Control", "private, max-age=5, smax-age=0");
 * 	}
 *
 * 	return json(data, { headers });
 * }
 * ```
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Server/Is Prefetch
 */
import { getHeaders } from "./get-headers.js";

/**
 * Check if a specific Request is a prefetch request created by using
 * <Link prefetch="intent"> or <Link prefetch="render">.
 *
 * @example
 * export async function loader({ request }: Route.LoaderArgs) {
 *   let data = await getData(request)
 *   let headers = new Headers()
 *   if (isPrefetch(request)) {
 *     headers.set("Cache-Control", "private, max-age=5, smax-age=0")
 *   }
 *   return json(data, { headers })
 * }
 */
export function isPrefetch(request: Request): boolean;
export function isPrefetch(headers: Headers): boolean;
export function isPrefetch(requestOrHeaders: Request | Headers): boolean {
	let headers = getHeaders(requestOrHeaders);
	if (!headers) {
		return false;
	}
	let purpose =
		headers.get("Purpose") ||
		headers.get("X-Purpose") ||
		headers.get("Sec-Purpose") ||
		headers.get("Sec-Fetch-Purpose") ||
		headers.get("Moz-Purpose") ||
		headers.get("X-Moz");

	return purpose?.toLowerCase() === "prefetch";
}
