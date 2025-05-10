/**
 * The CORS middleware simplifies the setup of CORS headers. Internally it uses the same {@link cors | CORS} utils exported from `remix-utils/cors`.
 *
 * To use it, first create a CORS middleware instance:
 *
 * ```ts
 * import { unstable_createCorsMiddleware } from "remix-utils/middleware/cors";
 *
 * export const [corsMiddleware] = unstable_createCorsMiddleware();
 * ```
 *
 * Add the `corsMiddleware` to the `unstable_middleware` array in the route where you want to configure CORS, use it in your `app/root.tsx` file to apply it globally:
 *
 * ```ts
 * import { corsMiddleware } from "~/middleware/cors.server";
 *
 * export const unstable_middleware = [corsMiddleware];
 * ```
 *
 * Now, every request will have the CORS headers set.
 *
 * You can customize the CORS middleware by passing an options object to the `unstable_createCorsMiddleware` function.
 *
 * The options lets you configure the CORS headers, e.g. `origin`, `methods`, `allowedHeaders`, etc.
 *
 * ```ts
 * import { unstable_createCorsMiddleware } from "remix-utils/middleware/cors";
 *
 * export const [corsMiddleware] = unstable_createCorsMiddleware({
 *   origin: "https://example.com",
 *   methods: ["GET", "POST"],
 *   allowedHeaders: ["Content-Type", "Authorization"],
 *   exposedHeaders: ["X-My-Custom-Header"],
 *   maxAge: 3600,
 *   credentials: true,
 * });
 * ```
 *
 * The {@link cors.Options | accepted `options`} are the same as those accepted by the `cors` util.
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Middleware/CORS
 */
import type { unstable_MiddlewareFunction } from "react-router";
import { CORS, type cors } from "../cors.js";

/**
 * Creates a middleware function that applies CORS headers to the response.
 *
 * You can customize the CORS options by passing an object with the following
 * properties:
 * - origin: The origin(s) allowed to access the resource. This can be a
 *  string, boolean, or an array of strings or regular expressions.
 * - methods: The HTTP methods allowed for cross-origin requests.
 * - allowedHeaders: The headers allowed in the request.
 * - exposedHeaders: The headers exposed to the client.
 * - credentials: Whether to include credentials in the request.
 * - maxAge: The maximum age of the preflight request in seconds.
 *
 * @param options Optional configuration for CORS
 * @returns A middleware function that applies CORS headers
 */
export function unstable_createCorsMiddleware(
	options: unstable_createCorsMiddleware.Options,
): unstable_createCorsMiddleware.ReturnType {
	let cors = new CORS(options);
	return [
		async function corsMiddleware({ request }, next) {
			let response = await next();
			return await cors.exec(request, response);
		},
	];
}

export namespace unstable_createCorsMiddleware {
	export interface Options extends cors.Options {}

	/**
	 * The return type of `unstable_createCorsMiddleware`.
	 */
	export type ReturnType = [unstable_MiddlewareFunction<Response>];
}
