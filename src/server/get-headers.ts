/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/get-client-ip-address`.
 *
 * > [!NOTE]
 * > This depends on `is-ip`.
 *
 * This function receives a Request or Headers objects and will try to get the IP address of the client (the user) who originated the request.
 *
 * ```ts
 * import { getClientIPAddress } from "remix-utils/get-client-ip-address";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	// using the request
 * 	let ipAddress = getClientIPAddress(request);
 * 	// or using the headers
 * 	let ipAddress = getClientIPAddress(request.headers);
 * }
 * ```
 *
 * If it can't find he IP address the return value will be `null`. Remember to check if it was able to find it before using it.
 *
 * The function uses the following list of headers, in order of preference:
 *
 * - X-Client-IP
 * - X-Forwarded-For
 * - HTTP-X-Forwarded-For
 * - Fly-Client-IP
 * - CF-Connecting-IP
 * - Fastly-Client-Ip
 * - True-Client-Ip
 * - X-Real-IP
 * - X-Cluster-Client-IP
 * - X-Forwarded
 * - Forwarded-For
 * - Forwarded
 * - DO-Connecting-IP
 * - oxygen-buyer-ip
 *
 * When a header is found that contains a valid IP address, it will return without checking the other headers.
 *
 * > [!WARNING]
 * > On local development the function is most likely to return `null`. This is because the browser doesn't send any of the above headers, if you want to simulate those headers you will need to either add it to the request Remix receives in your HTTP server or run a reverse proxy like NGINX that can add them for you.
 *
 * ---
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/locales-server`.
 *
 * > [!NOTE]
 * > This depends on `intl-parse-accept-language`.
 *
 * This function let you get the locales of the client (the user) who originated the request.
 *
 * ```ts
 * import { getClientLocales } from "remix-utils/locales/server";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	// using the request
 * 	let locales = getClientLocales(request);
 * 	// or using the headers
 * 	let locales = getClientLocales(request.headers);
 * }
 * ```
 *
 * The return value is a Locales type, which is `string | string[] | undefined`.
 *
 * The returned locales can be directly used on the Intl API when formatting dates, numbers, etc.
 *
 * ```ts
 * import { getClientLocales } from "remix-utils/locales/server";
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	let locales = getClientLocales(request);
 * 	let nowDate = new Date();
 * 	let formatter = new Intl.DateTimeFormat(locales, {
 * 		year: "numeric",
 * 		month: "long",
 * 		day: "numeric",
 * 	});
 * 	return json({ now: formatter.format(nowDate) });
 * }
 * ```
 *
 * The value could also be returned by the loader and used on the UI to ensure the user's locales is used on both server and client formatted dates.
 *
 * ---
 *
 *
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
 * ---
 *
 *
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
 * ---
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/sec-fetch`.
 *
 * > [!NOTE]
 * > This depends on `zod`.
 *
 * The `Sec-Fetch` headers include information about the request, e.g. where is the data going to be used, or if it was initiated by the user.
 *
 * You can use the `remix-utils/sec-fetch` utils to parse those headers and get the information you need.
 *
 * ```ts
 * import { fetchDest, fetchMode, fetchSite, isUserInitiated } from "remix-utils/sec-fetch";
 * ```
 *
 *
 * The `Sec-Fetch-Dest` header indicates the destination of the request, e.g. `document`, `image`, `script`, etc.
 *
 * If the value is `empty` it means it will be used by a `fetch` call, this means you can differentiate between a request made with and without JS by checking if it's `document` (no JS) or `empty` (JS enabled).
 *
 * ```ts
 * import { fetchDest } from "remix-utils/sec-fetch";
 *
 * export async function action({ request }: Route.ActionArgs) {
 * 	let data = await getDataSomehow();
 *
 * 	// if the request was made with JS, we can just return json
 * 	if (fetchDest(request) === "empty") return json(data);
 * 	// otherwise we redirect to avoid a reload to trigger a new submission
 * 	return redirect(destination);
 * }
 * ```
 *
 *
 * The `Sec-Fetch-Mode` header indicates how the request was initiated, e.g. if the value is `navigate` it was triggered by the user loading the page, if the value is `no-cors` it could be an image being loaded.
 *
 * ```ts
 * import { fetchMode } from "remix-utils/sec-fetch";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	let mode = fetchMode(request);
 * 	// do something based on the mode value
 * }
 * ```
 *
 *
 * The `Sec-Fetch-Site` header indicates where the request is being made, e.g. `same-origin` means the request is being made to the same domain, `cross-site` means the request is being made to a different domain.
 *
 * ```ts
 * import { fetchSite } from "remix-utils/sec-fetch";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	let site = fetchSite(request);
 * 	// do something based on the site value
 * }
 * ```
 *
 *
 * The `Sec-Fetch-User` header indicates if the request was initiated by the user, this can be used to differentiate between a request made by the user and a request made by the browser, e.g. a request made by the browser to load an image.
 *
 * ```ts
 * import { isUserInitiated } from "remix-utils/sec-fetch";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	let userInitiated = isUserInitiated(request);
 * 	// do something based on the userInitiated value
 * }
 * ```
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Server/Get Headers
 */
/**
 * Receives a Request or Headers objects.
 * If it's a Request returns the request.headers
 * If it's a Headers returns the object directly.
 */
export function getHeaders(requestOrHeaders: Request | Headers): Headers {
	if (requestOrHeaders instanceof Request) {
		return requestOrHeaders.headers;
	}

	return requestOrHeaders;
}
