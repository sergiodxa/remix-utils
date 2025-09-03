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
