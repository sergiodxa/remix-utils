/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/redirect-back`.
 *
 * This function is a wrapper of the `redirect` helper from Remix. Unlike Remix's version, this one receives the whole request object as the first value and an object with the response init and a fallback URL.
 *
 * The response created with this function will have the `Location` header pointing to the `Referer` header from the request, or if not available, the fallback URL provided in the second argument.
 *
 * ```ts
 * import { redirectBack } from "remix-utils/redirect-back";
 *
 * export async function action({ request }: Route.ActionArgs) {
 * 	throw redirectBack(request, { fallback: "/" });
 * }
 * ```
 *
 * This helper is most useful when used in a generic action to send the user to the same URL it was before.
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Server/Redirect Back
 */
import { data, type UNSAFE_DataWithResponseInit } from "react-router";

/**
 * Create a new Response with a redirect set to the URL the user was before.
 * It uses the Referer header to detect the previous URL. It asks for a fallback
 * URL in case the Referer couldn't be found, this fallback should be a URL you
 * may be ok the user to land to after an action even if it's not the same.
 * @example
 * export async function action({ request }: Route.ActionArgs) {
 *   await doSomething(request);
 *   // If the user was on `/search?query=something` we redirect to that URL
 *   // but if we couldn't we redirect to `/search`, which is an good enough
 *   // fallback
 *   return redirectBack(request, { fallback: "/search" });
 * }
 */
export function redirectBack(
	request: Request,
	{ fallback, ...init }: ResponseInit & { fallback: string },
): UNSAFE_DataWithResponseInit<never> {
	let responseInit = init;
	if (typeof responseInit === "number") {
		responseInit = { status: responseInit };
	} else if (responseInit.status === undefined) {
		responseInit.status = 302;
	}

	let headers = new Headers(responseInit.headers);
	headers.set("Location", request.headers.get("Referer") ?? fallback);

	return data(null, {
		...responseInit,
		headers,
	}) as UNSAFE_DataWithResponseInit<never>;
}
