import { useMatches } from "@remix-run/react";

/**
 * Determine if at least one of the routes is asking to load JS and return a
 * boolean.
 *
 * To request JS to be loaded, the route must export a handle with an object,
 * this object must contain a boolean property named `hydrate` or a function
 * named `hydrate`, in which case the function will be called with the `data`
 * from the loader of that route so it can be used to dynamically load or not
 * JavaScript.
 * @example
 * // This route needs to load JS
 * export let handle = { hydrate: true };
 * @example
 * // This route uses the data to know if it should load JS
 * export let handle = {
 *   hydrate(data: RouteData) {
 *     return data.needsJs;
 *   }
 * };
 */
export function useShouldHydrate() {
  return useMatches().some((match) => {
    if (!match.handle) return false;

    let { handle, data } = match;

    // handle must be an object to continue
    if (typeof handle !== "object") return false;
    if (handle === null) return false;
    if (Array.isArray(handle)) return false;
    if (!("hydrate" in handle)) return false;

    // get hydrate from handle (it may not exists)
    let hydrate = handle.hydrate as
      | undefined
      | boolean
      | ((data: unknown) => boolean);

    if (!hydrate) return false;

    if (typeof hydrate === "function") return hydrate(data);
    return hydrate;
  });
}
