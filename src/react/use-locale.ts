import { useMatches } from "@remix-run/react";
import type { Locale } from "../server/get-client-locale";

/**
 * Get the locale returned by the loader of the root route.
 *
 * This is useful to return the locale of the user once in the root and access
 * it everywhere in the UI without having to pass it as a prop or create a
 * custom context object.
 *
 * @example
 * // in the root loader
 * export let loader: LoaderFunction = async ({ request }) => {
 *   let locale = getClientLocale(request);
 *   return json({ locale });
 * }
 * // in any route (including root!)
 * export default function Screen() {
 *   let locale = useLocale();
 *   let date = new Date();
 *   let dateTime = date.toISOString;
 *   let formattedDate = date.toLocaleDateString(locale, options)
 *   return <time dateTime={dateTime}>{formattedDate}</time>
 * }
 */
export function useLocale(): Locale {
  let matches = useMatches();

  if (!matches) return undefined;
  if (matches.length === 0) return undefined;

  let [rootMatch] = matches;

  // check if rootMatch exists and has data
  if (!rootMatch) return undefined;
  if (!rootMatch.data) return undefined;

  let { data } = rootMatch;

  // check if data is an object and has locale
  if (typeof data !== "object") return undefined;
  if (data === null) return undefined;
  if (Array.isArray(data)) return undefined;
  if (!("locale" in data)) return undefined;

  let { locale } = data;

  // check the type of value of locale
  // locale could be a string
  if (typeof locale === "string") return locale;
  // or it could be an array of strings
  if (
    Array.isArray(locale) &&
    locale.every((value) => typeof value === "string")
  ) {
    return locale;
  }
  // finally, return undefined
  return undefined;
}
