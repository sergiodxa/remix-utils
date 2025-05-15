import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Cookie } from "react-router";
import type { TypedCookie } from "./typed-cookie.js";

/**
 * Rolling cookies allows you to prolong the expiration of a cookie by updating 
 * the expiration date of every cookie.
 * 
 * The `rollingCookie` function is prepared to be used in `entry.server` 
 * exported function to update the expiration date of a cookie if no loader set 
 * it.
 * 
 * For document request you can use it on the `handleRequest` function:
 * 
 * ```ts
 * import { rollingCookie } from "remix-utils/rolling-cookie";
 * import { sessionCookie } from "~/session.server";
 * 
 * export default function handleRequest(
 *   request: Request,
 *   responseStatusCode: number,
 *   responseHeaders: Headers,
 *   remixContext: EntryContext
 * ) {
 *   await rollingCookie(sessionCookie, request, responseHeaders);
 * 
 *   return isbot(request.headers.get("user-agent"))
 *     ? handleBotRequest(
 *         request,
 *         responseStatusCode,
 *         responseHeaders,
 *         remixContext
 *       )
 *     : handleBrowserRequest(
 *         request,
 *         responseStatusCode,
 *         responseHeaders,
 *         remixContext
 *       );
 * }
 * ```
 * 
 * And for data request you can do it on the `handleDataRequest` function:

 * ```ts
 * import { rollingCookie } from "remix-utils/rolling-cookie";
 *
 * export let handleDataRequest: HandleDataRequestFunction = async (
 *   response: Response,
 *   { request }
 * ) => {
 *   let cookieValue = await sessionCookie.parse(
 *     responseHeaders.get("set-cookie")
 *   );
 *   if (!cookieValue) {
 *     cookieValue = await sessionCookie.parse(request.headers.get("cookie"));
 *     responseHeaders.append(
 *       "Set-Cookie",
 *       await sessionCookie.serialize(cookieValue)
 *     );
 *   }
 * 
 *   return response;
 * };
 * ```
 * 
 * @param cookie The cookie to keep alive
 * @param request The request object
 * @param responseHeaders The response headers object
 * @returns A promise that resolves when the cookie has been set in the response
 * @see https://sergiodxa.com/articles/add-rolling-sessions-to-remix
 */
export async function rollingCookie<Schema extends StandardSchemaV1>(
	cookie: Cookie | TypedCookie<Schema>,
	request: Request,
	responseHeaders: Headers,
) {
	let requestCookie = await cookie.parse(request.headers.get("Cookie"));
	if (!requestCookie) return;

	let responseCookie = await cookie.parse(responseHeaders.get("Set-Cookie"));
	if (responseCookie !== null) return;

	responseHeaders.append("Set-Cookie", await cookie.serialize(requestCookie));
}
