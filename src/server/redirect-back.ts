/**
 * Create a new Response with a redirect set to the URL the user was before.
 * It uses the Referer header to detect the previous URL. It asks for a fallback
 * URL in case the Referer couldn't be found, this fallback should be a URL you
 * may be ok the user to land to after an action even if it's not the same.
 * @example
 * export async function action({ request }: ActionArgs) {
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
): Response {
	let responseInit = init;
	if (typeof responseInit === "number") {
		responseInit = { status: responseInit };
	} else if (responseInit.status === undefined) {
		responseInit.status = 302;
	}

	let headers = new Headers(responseInit.headers);
	headers.set("Location", request.headers.get("Referer") ?? fallback);

	return new Response(null, {
		...responseInit,
		headers,
	});
}
