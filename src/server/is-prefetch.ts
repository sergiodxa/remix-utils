import { getHeaders } from "./get-headers.js";

/**
 * Check if a specific Request is a prefetch request created by using
 * <Link prefetch="intent"> or <Link prefetch="render">.
 *
 * @example
 * export async function loader({ request }: LoaderFunctionArgs) {
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
