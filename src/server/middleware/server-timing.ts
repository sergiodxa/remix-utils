/**
 * > This depends on `@edgefirst-dev/server-timing`.
 * The server timing middleware let's you add a `Server-Timing` header to the response with the time it took to run the loaders and actions.
 *
 * ```ts
 * import { createServerTimingMiddleware } from "remix-utils/middleware/server-timing";
 *
 * export const [serverTimingMiddleware, getTimingCollector] =
 *   createServerTimingMiddleware();
 * ```
 *
 * To use it, you need to add it to the `middleware` array in your `app/root.tsx` file.
 *
 * ```ts
 * import { serverTimingMiddleware } from "~/middleware/server-timing.server";
 *
 * export const middleware: Route.MiddlewareFunction[] = [serverTimingMiddleware];
 * ```
 *
 * And you can use the `getTimingCollector` function in your loaders and actions to add timings to the response.
 *
 * ```ts
 * import { getTimingCollector } from "~/middleware/server-timing.server";
 *
 * export async function loader({ context }: Route.LoaderArgs) {
 *   let collector = getTimingCollector(context);
 *   return await collector.measure("name", "optional description", async () => {
 *     return await getData();
 *   });
 * }
 * ```
 *
 * The `measure` function will measure the time it took to run the function passed as the last argument and add it to the `Server-Timing` header.
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Middleware/Server Timing
 */
import { TimingCollector } from "@edgefirst-dev/server-timing";
import type { MiddlewareFunction } from "react-router";
import { createContext } from "react-router";
import type { MiddlewareGetter } from "./utils.js";

/**
 * Create a middleware that gives you access to a `TimingCollector` instance,
 * used to collect server timing metrics and report them in the response
 * headers.
 *
 * The reported metrics will be available in the browser's developer tools.
 *
 * @returns A tuple with the middleware function and a function to get the
 * `TimingCollector` instance from the context.
 * @example
 * import { createServerTimingMiddleware } from "remix-utils/middleware/server-timing";
 *
 * const [serverTimingMiddleware, getTimingCollector] = createServerTimingMiddleware();
 *
 * export const middleware: Route.MiddlewareFunction[] = [serverTimingMiddleware];
 *
 * export async function loader({ context }: Route.LoaderArgs) {
 *  let collector = getTimingCollector(context);
 *  return await collector.measure("name", "optional description", () => {
 *    return getData();
 *  });
 * }
 */
export function createServerTimingMiddleware(): createServerTimingMiddleware.ReturnType {
	const timingContext = createContext<TimingCollector>();

	return [
		async function serverTimingMiddleware({ context }, next) {
			let collector = new TimingCollector();
			context.set(timingContext, collector);
			let response = await next();
			collector.toHeaders(response.headers);
			return response;
		},

		function getTimingCollector(context) {
			return context.get(timingContext);
		},
	];
}

export namespace createServerTimingMiddleware {
	/**
	 * The return type of `createServerTimingMiddleware`.
	 */
	export type ReturnType = [
		MiddlewareFunction<Response>,
		MiddlewareGetter<TimingCollector>,
	];
}

export const [serverTimingMiddleware, getTimingCollector] =
	createServerTimingMiddleware();
