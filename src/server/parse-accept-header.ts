/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/respond-to` and `bunx shadcn@latest add @remix-utils/parse-accept-header`.
 *
 * If you're building a resource route and wants to send a different response based on what content type the client requested (e.g. send the same data as PDF or XML or JSON), you will need to implement content negotiation, this can be done with the `respondTo` header.
 *
 * ```ts
 * import { respondTo } from "remix-utils/respond-to";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 *   // do any work independent of the response type before respondTo
 *   let data = await getData(request);
 *
 *   let headers = new Headers({ vary: "accept" });
 *
 *   // Here we will decide how to respond to different content types
 *   return respondTo(request, {
 *     // The handler can be a subtype handler, in `text/html` html is the subtype
 *     html() {
 *       // We can call any function only really need to respond to this
 *       // content-type
 *       let body = ReactDOMServer.renderToString(<UI {...data} />);
 *       headers.append("content-type", "text/html");
 *       return new Response(body, { headers });
 *     },
 *     // It can also be a highly specific type
 *     async "application/rss+xml"() {
 *       // we can do more async work inside this code if needed
 *       let body = await generateRSSFeed(data);
 *       headers.append("content-type", "application/rss+xml");
 *       return new Response(body, { headers });
 *     },
 *     // Or a generic type
 *     async text() {
 *       // To respond to any text type, e.g. text/plain, text/csv, etc.
 *       let body = generatePlain(data);
 *       headers.append("content-type", "text/plain");
 *       return new Response(body, { headers });
 *     },
 *     // The default will be used if the accept header doesn't match any of the
 *     // other handlers
 *     default() {
 *       // Here we could have a default type of response, e.g. use json by
 *       // default, or we can return a 406 which means the server can't respond
 *       // with any of the requested content types
 *       return new Response("Not Acceptable", { status: 406 });
 *     },
 *   });
 * }
 * ```
 *
 * Now, the `respondTo` function will check the `Accept` header and call the correct handler, to know which one to call it will use the `parseAcceptHeader` function also exported from Remix Utils
 *
 * ```ts
 * import { parseAcceptHeader } from "remix-utils/parse-accept-header";
 *
 * let parsed = parseAcceptHeader(
 * 	"text/html, application/xhtml+xml, application/xml;q=0.9, image/webp, image/*, * /*;q=0.8",
 * );
 * ```
 *
 * The result is an array with the type, subtype and extra params (e.g. the `q` value). The order will be the same encountered in the header, in the example aabove `text/html` will be the first, followed by `application/xhtml+xml`.
 *
 * This means that the `respondTo` helper will prioritize any handler that match `text/html`, in our example above, that will be the `html` handler, but if we remove it then the `text` handler will be called instead.67
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Server/Parse Accept Header
 */
/**
 * Given an accept header like `text/html, application/json;q=0.9` it will parse
 * it and return an array of object with the mime-type, subtype and params of
 * each media type.
 * @param header The Accept header value
 * @returns An array of objects with the type, subtype and params of each media type
 */
export function parseAcceptHeader(header: string) {
	let types = header.split(",").map((type) => type.trim());

	let parsedTypes = types
		.map((value) => {
			let [mediaType, ...params] = value.split(";");

			if (!mediaType) return void 0;

			let [type, subtype] = mediaType.split("/").map((part) => part.trim());

			let parsedParams = Object.fromEntries(params.map((param) => param.split("=")));

			return { type, subtype, params: parsedParams };
		})
		.filter((v) => v !== undefined);

	return parsedTypes;
}
