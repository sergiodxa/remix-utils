import { TimingCollector } from "@edgefirst-dev/server-timing";
import type { unstable_MiddlewareFunction } from "react-router";
import { unstable_createContext } from "react-router";
import type { unstable_MiddlewareGetter } from "./utils.js";

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
 * import { unstable_createServerTimingMiddleware } from "remix-utils/middleware/server-timing";
 *
 * const [serverTimingMiddleware, getTimingCollector] = unstable_createServerTimingMiddleware();
 *
 * export const unstable_middleware = [serverTimingMiddleware];
 *
 * export async function loader({ context }: Route.LoaderArgs) {
 *  let collector = getTimingCollector(context);
 *  return await collector.measure("name", "optional description", () => {
 *    return getData();
 *  });
 * }
 */
export function unstable_createServerTimingMiddleware(): unstable_createServerTimingMiddleware.ReturnType {
	const timingContext = unstable_createContext<TimingCollector>();

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

export namespace unstable_createServerTimingMiddleware {
	/**
	 * The return type of `unstable_createServerTimingMiddleware`.
	 */
	export type ReturnType = [
		unstable_MiddlewareFunction<Response>,
		unstable_MiddlewareGetter<TimingCollector>,
	];
}

export const [serverTimingMiddleware, getTimingCollector] =
	unstable_createServerTimingMiddleware();
