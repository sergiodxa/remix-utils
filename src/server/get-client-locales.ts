/**
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
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Server/Get Client Locales
 */
import { parseAcceptLanguage } from "intl-parse-accept-language";
import { getHeaders } from "./get-headers.js";

export type Locales = string[] | undefined;

/**
 * Get the client's locales from the Accept-Language header.
 * If the header is not defined returns null.
 * If the header is defined return an array of locales, sorted by the quality
 * value.
 *
 * @example
 * export async function loader({ request }: Route.LoaderArgs) {
 *   let locales = getClientLocales(request)
 *   let date = new Date().toLocaleDateString(locales, {
 *     "day": "numeric",
 *   });
 *   return json({ date })
 * }
 */
export function getClientLocales(headers: Headers): Locales;
export function getClientLocales(request: Request): Locales;
export function getClientLocales(requestOrHeaders: Request | Headers): Locales {
	let headers = getHeaders(requestOrHeaders);

	let acceptLanguage = headers.get("Accept-Language");

	// if the header is not defined, return undefined
	if (!acceptLanguage) return undefined;

	let locales = parseAcceptLanguage(acceptLanguage, {
		validate: Intl.DateTimeFormat.supportedLocalesOf,
		ignoreWildcard: true,
	});

	// if there are no locales found, return undefined
	if (locales.length === 0) return undefined;
	// if there are multiple locales, return the array
	return locales;
}
