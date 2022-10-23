import { useMatches } from "@remix-run/react";
import type { Locales } from "../server/get-client-locales";

/**
 * Get the locales returned by the loader of the root route.
 *
 * This is useful to return the locales of the user once in the root and access
 * it everywhere in the UI without having to pass it as a prop or create a
 * custom context object.
 *
 * @example
 * // in the root loader
 * export let loader: LoaderFunction = async ({ request }) => {
 *   let locales = getClientLocales(request);
 *   return json({ locales });
 * }
 * // in any route (including root!)
 * export default function Screen() {
 *   let locales = useLocales();
 *   let date = new Date();
 *   let dateTime = date.toISOString;
 *   let formattedDate = date.toLocaleDateString(locales, options)
 *   return <time dateTime={dateTime}>{formattedDate}</time>
 * }
 */
export function useLocales(): Locales {
  let matches = useMatches();

  if (!matches) return undefined;
  if (matches.length === 0) return undefined;

  let [rootMatch] = matches;

  // check if rootMatch exists and has data
  if (!rootMatch) return undefined;
  if (!rootMatch.data) return undefined;

  let { data } = rootMatch;

  // check if data is an object and has locales
  if (typeof data !== "object") return undefined;
  if (data === null) return undefined;
  if (Array.isArray(data)) return undefined;
  if (!("locales" in data)) return undefined;

  let { locales } = data;

  // check the type of value of locales
  // it could be a string
  // or it could be an array of strings
  if (
    Array.isArray(locales) &&
    locales.every((value) => typeof value === "string")
  ) {
    return locales;
  }
  // finally, return undefined
  return undefined;
}
