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
