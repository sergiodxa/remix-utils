import { z } from "zod";
import { getHeaders } from "./get-headers.js";

export const FetchDestSchema = z.enum([
	"audio",
	"audioworklet",
	"document",
	"embed",
	"empty",
	"font",
	"frame",
	"iframe",
	"image",
	"manifest",
	"object",
	"paintworklet",
	"report",
	"script",
	"serviceworker",
	"sharedworker",
	"style",
	"track",
	"video",
	"worker",
	"xslt",
]);

export type FetchDest = z.output<typeof FetchDestSchema>;

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
	let result = FetchDestSchema.safeParse(header);
	if (result.success) return result.data;
	return null;
}

export const FetchModeSchema = z.enum([
	"cors",
	"navigate",
	"no-cors",
	"same-origin",
	"websocket",
]);

export type FetchMode = z.output<typeof FetchModeSchema>;

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Mode
 */
export function fetchMode(request: Request): FetchMode | null;
export function fetchMode(headers: Headers): FetchMode | null;
export function fetchMode(input: Request | Headers): FetchMode | null {
	let headers = getHeaders(input).get("Set-Fetch-Mode");
	let result = FetchModeSchema.safeParse(headers);
	if (result.success) return result.data;
	return null;
}

export const FetchSiteSchema = z.enum([
	"cross-site",
	"same-origin",
	"same-site",
	"none",
]);

export type FetchSite = z.output<typeof FetchSiteSchema>;

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Site
 */
export function fetchSite(request: Request): FetchSite | null;
export function fetchSite(headers: Headers): FetchSite | null;
export function fetchSite(input: Request | Headers): FetchSite | null {
	let headers = getHeaders(input).get("Set-Fetch-Site");
	let result = FetchSiteSchema.safeParse(headers);
	if (result.success) return result.data;
	return null;
}

export const FetchUserSchema = z.literal("?1");

export type FetchUser = z.output<typeof FetchUserSchema>;

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-User
 */
export function isUserInitiated(request: Request): boolean;
export function isUserInitiated(headers: Headers): boolean;
export function isUserInitiated(input: Request | Headers): boolean {
	let headers = getHeaders(input).get("Set-Fetch-User");
	let result = FetchUserSchema.safeParse(headers);
	if (result.success) return true;
	return false;
}
