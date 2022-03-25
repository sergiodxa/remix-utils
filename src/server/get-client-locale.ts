import { parseAcceptLanguage } from "intl-parse-accept-language";
import { getHeaders } from "./get-headers";

export type Locale = string | string[] | undefined;

/**
 * Get the client's locale from the Accept-Language header.
 * If the header is not defined returns null.
 * If the header is defined return an array of locales, sorted by the quality
 * value.
 *
 * @example
 * export let loader: LoaderFunction = async ({ request }) => {
 *   let locale = getClientLocale(request)
 *   let date = new Date().toLocaleDateString(locale, {
 *     "day": "numeric",
 *   });
 *   return json({ date })
 * }
 */
export function getClientLocale(headers: Headers): Locale;
export function getClientLocale(request: Request): Locale;
export function getClientLocale(requestOrHeaders: Request | Headers): Locale {
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
  // if there is only one locale, return it
  if (locales.length === 1) return locales[0];
  // if there are multiple locales, return the array
  return locales;
}
