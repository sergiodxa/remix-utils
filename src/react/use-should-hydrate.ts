/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/use-should-hydrate`.
 *
 * > [!NOTE]
 * > This depends on `react-router` and `react`.
 *
 * If you are building a Remix application where most routes are static, and you want to avoid loading client-side JS, you can use this hook, plus some conventions, to detect if one or more active routes needs JS and only render the Scripts component in that case.
 *
 * In your document component, you can call this hook to dynamically render the Scripts component if needed.
 *
 * ```tsx
 * import type { ReactNode } from "react";
 * import { Links, LiveReload, Meta, Scripts } from "react-router";
 * import { useShouldHydrate } from "remix-utils/use-should-hydrate";
 *
 * interface DocumentProps {
 * 	children: ReactNode;
 * 	title?: string;
 * }
 *
 * export function Document({ children, title }: DocumentProps) {
 * 	let shouldHydrate = useShouldHydrate();
 * 	return (
 * 		<html lang="en">
 * 			<head>
 * 				<meta charSet="utf-8" />
 * 				<link rel="icon" href="/favicon.png" type="image/png" />
 * 				{title ? <title>{title}</title> : null}
 * 				<Meta />
 * 				<Links />
 * 			</head>
 * 			<body>
 * 				{children}
 * 				{shouldHydrate && <Scripts />}
 * 				<LiveReload />
 * 			</body>
 * 		</html>
 * 	);
 * }
 * ```
 *
 * Now, you can export a `handle` object with the `hydrate` property as `true` in any route module.
 *
 * ```ts
 * export let handle = { hydrate: true };
 * ```
 *
 * This will mark the route as requiring JS hydration.
 *
 * In some cases, a route may need JS based on the data the loader returned. For example, if you have a component to purchase a product, but only authenticated users can see it, you don't need JS until the user is authenticated. In that case, you can make `hydrate` be a function receiving your loader data.
 *
 * ```ts
 * export let handle = {
 * 	hydrate(data: LoaderData) {
 * 		return data.user.isAuthenticated;
 * 	},
 * };
 * ```
 *
 * The `useShouldHydrate` hook will detect `hydrate` as a function and call it using the route data.
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Hook/Use Should Hydrate
 */
import { useMatches } from "react-router";

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
		let hydrate = handle.hydrate as undefined | boolean | ((data: unknown) => boolean);

		if (!hydrate) return false;

		if (typeof hydrate === "function") return hydrate(data);
		return hydrate;
	});
}
