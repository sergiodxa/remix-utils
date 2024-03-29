import { getHeaders } from "./get-headers.js";
import { parseAcceptHeader } from "./parse-accept-header.js";

export interface RespondToHandlers {
	default(): Response | Promise<Response>;
	[key: string]: () => Response | Promise<Response>;
}

/**
 * Based on the request's Accept header, respond with the appropriate handler.
 * Fallback to a default handler if no match is found.
 *
 * **Note**: This doesn't return a Remix's TypedResponse for json, it's always
 * typed as a Response object, this is mostly useful for responding to external
 * requests, not to fetchers or any other function you call in your code.
 *
 * @param request The request or request.headers to respond to
 * @param handlers The handlers to respond with
 * @returns The response from the handler
 * @example
 * export async function loader({ request }: LoaderFunctionArgs) {
 *   // do any work independent of the response type before respondTo
 *   let data = await getData(request);
 *   return respondTo(request, {
 *     // The handler can be a subtype handler, in text/html html is the subtype
 *     html() {
 *       let result = ReactDOMServer.renderToString(<UI {...data} />)
 *       return html(result)
 *     },
 *     // It can also be a highly specific type, also an async function if needed
 *     async "application/rss+xml"() {
 *       let rss = await generateRSSFeed(data);
 *       let headers = new Headers({ "content-type": "application/rss+xml" })
 *       return new Response(rss, { headers })
 *     },
 *     // The default will be used if the accept header doesn't match any of the other handlers
 *     default() {
 *       return new Response("Not Acceptable", { status: 406 })
 *     }
 *   })
 * }
 */
export function respondTo(
	request: Request,
	handlers: RespondToHandlers,
): Promise<Response> | Response;
export function respondTo(
	headers: Headers,
	handlers: RespondToHandlers,
): Promise<Response> | Response;
export function respondTo(
	requestOrHeaders: Request | Headers,
	handlers: RespondToHandlers,
): Promise<Response> | Response {
	let headers = getHeaders(requestOrHeaders);

	let accept = headers.get("accept");

	if (!accept) return handlers.default();

	let types = parseAcceptHeader(accept);

	for (let { type, subtype } of types) {
		let handler = handlers[`${type}/${subtype}`];
		if (handler) return handler();
		handler = handlers[subtype];
		if (handler) return handler();
		handler = handlers[type];
		if (handler) return handler();
		continue;
	}

	return handlers.default();
}
