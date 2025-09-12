/**
 * > This depends on `zod`, and React Router.
 *
 * The rolling cookie middleware allows you to prolong the expiration of a
 * cookie by updating the expiration date on every request.
 *
 * First, create a rolling cookie middleware instance:
 *
 * ```ts
 * import { createRollingCookieMiddleware } from "remix-utils/middleware/rolling-cookie";
 *
 * // This must be a Cookie or TypedCookie instance
 * import { cookie } from "~/cookies";
 *
 * export const [rollingCookieMiddleware] = createRollingCookieMiddleware(
 *   { cookie }
 * );
 * ```
 *
 * Then, add the `rollingCookieMiddleware` to the `middleware` array in your `app/root.tsx` file.
 *
 * ```ts
 * import { rollingCookieMiddleware } from "~/middleware/rolling-cookie.server";
 *
 * export const middleware: Route.MiddlewareFunction[] = [rollingCookieMiddleware];
 * ```
 *
 * Now, every request will have the cookie updated with a new expiration date.
 *
 * If you set the same cookie in your own loaders or actions, the middleware
 * will detect this and do nothing, so you can use the middleware and set the
 * cookie in your own code without worrying about it.
 * @author Sergio Xalambrí
 * @module Middleware/Rolling Cookie
 */
import type { Cookie, MiddlewareFunction } from "react-router";
import { rollingCookie } from "../rolling-cookie.js";

/**
 * @param options Options for the middleware
 * @param options.cookie The cookie to use for rolling
 * @returns A middleware function that keeps the cookie alive
 * @example
 * import { createRollingCookieMiddleware } from "remix-utils/middleware/rolling-cookie";
 *
 * // This must be a Cookie or TypedCookie instance
 * import { cookie } from "~/cookies";
 *
 * export const [rollingCookieMiddleware] = createRollingCookieMiddleware(
 *   { cookie }
 * );
 */
export function createRollingCookieMiddleware(
	options: createRollingCookieMiddleware.Options,
): createRollingCookieMiddleware.ReturnType {
	return [
		async ({ request }, next) => {
			let response = await next();
			await rollingCookie(options.cookie, request, response.headers);
			return response;
		},
	];
}

/**
 * This namespace contains the types for the
 * `createRollingCookieMiddleware` function.
 * @see {@link createRollingCookieMiddleware}
 * @example
 * import { createRollingCookieMiddleware } from "remix-utils/middleware/rolling-cookie";
 *
 * let options: createRollingCookieMiddleware.Options;
 * let returnType: createRollingCookieMiddleware.ReturnType;
 */
export namespace createRollingCookieMiddleware {
	/**
	 * The options accepted by the `createRollingCookieMiddleware` function.
	 * @see {@link createRollingCookieMiddleware}
	 */
	export interface Options {
		/**
		 * The cookie to keep alive.
		 * This should be a valid cookie object.
		 * @see https://reactrouter.com/api/utils/createCookie
		 * @see https://reactrouter.com/explanation/sessions-and-cookies#cookies
		 */
		cookie: Cookie;
	}

	/**
	 * The return type of the `createRollingCookieMiddleware` function.
	 * @see {@link createRollingCookieMiddleware}
	 */
	export type ReturnType = [MiddlewareFunction<Response>];
}
