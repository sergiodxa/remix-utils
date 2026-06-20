/**
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
 * @module Server/Sec Fetch
 */
import { getHeaders } from "./get-headers.js";

export const FetchDestValues = [
	"audio" as const,
	"audioworklet" as const,
	"document" as const,
	"embed" as const,
	"empty" as const,
	"font" as const,
	"frame" as const,
	"iframe" as const,
	"image" as const,
	"manifest" as const,
	"object" as const,
	"paintworklet" as const,
	"report" as const,
	"script" as const,
	"serviceworker" as const,
	"sharedworker" as const,
	"style" as const,
	"track" as const,
	"video" as const,
	"worker" as const,
	"xslt" as const,
];

export type FetchDest = (typeof FetchDestValues)[number];

/**
 * Returns the value of the `Sec-Fetch-Dest` header.
 *
 * The `Sec-Fetch-Dest` header indicates the destination of the request and
 * can be used to know if the request came from a `fetch` call or not, among
 * other things.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Dest
 * @example
 * // Detect if the request came from a fetch call and return
 * // json, otherwise return a redirect
 * export async function action({ request }: Route.ActionArgs) {
 *   let dest = fetchDest(request);
 *   if (dest === "empty") return json(data)
 *   return redirect(destination)
 * }
 */
export function fetchDest(request: Request): FetchDest | null;
export function fetchDest(headers: Headers): FetchDest | null;
export function fetchDest(input: Request | Headers): FetchDest | null {
	let header = getHeaders(input).get("Sec-Fetch-Dest");
	if (!header) return null;
	let result = FetchDestValues.includes(header as FetchDest);
	if (result) return header as FetchDest;
	return null;
}

export const FetchModeValues = [
	"cors" as const,
	"navigate" as const,
	"no-cors" as const,
	"same-origin" as const,
	"websocket" as const,
];

export type FetchMode = (typeof FetchModeValues)[number];

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Mode
 */
export function fetchMode(request: Request): FetchMode | null;
export function fetchMode(headers: Headers): FetchMode | null;
export function fetchMode(input: Request | Headers): FetchMode | null {
	let headers = getHeaders(input).get("Sec-Fetch-Mode");
	if (!headers) return null;
	let result = FetchModeValues.includes(headers as FetchMode);
	if (result) return headers as FetchMode;
	return null;
}

export const FetchSiteValues = [
	"cross-site" as const,
	"same-origin" as const,
	"same-site" as const,
	"none" as const,
];

export type FetchSite = (typeof FetchSiteValues)[number];

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Site
 */
export function fetchSite(request: Request): FetchSite | null;
export function fetchSite(headers: Headers): FetchSite | null;
export function fetchSite(input: Request | Headers): FetchSite | null {
	let headers = getHeaders(input).get("Sec-Fetch-Site");
	if (!headers) return null;
	let result = FetchSiteValues.includes(headers as FetchSite);
	if (result) return headers as FetchSite;
	return null;
}

export const FetchUserValues = ["?1" as const];

export type FetchUser = (typeof FetchUserValues)[number];
/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-User
 */
export function isUserInitiated(request: Request): boolean;
export function isUserInitiated(headers: Headers): boolean;
export function isUserInitiated(input: Request | Headers): boolean {
	let headers = getHeaders(input).get("Sec-Fetch-User");
	if (!headers) return false;
	return headers === "?1";
}
