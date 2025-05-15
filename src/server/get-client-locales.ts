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
