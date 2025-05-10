/**
 * > This depends on `zod`, and React Router.
 *
 * The rolling cookie middleware allows you to prolong the expiration of a
 * cookie by updating the expiration date on every request.
 *
 * First, create a rolling cookie middleware instance:
 *
 * ```ts
 * import { unstable_createRollingCookieMiddleware } from "remix-utils/middleware/rolling-cookie";
 *
 * // This must be a Cookie or TypedCookie instance
 * import { cookie } from "~/cookies";
 *
 * export const [rollingCookieMiddleware] = unstable_createRollingCookieMiddleware(
 *   { cookie }
 * );
 * ```
 *
 * Then, add the `rollingCookieMiddleware` to the `unstable_middleware` array in your `app/root.tsx` file.
 *
 * ```ts
 * import { rollingCookieMiddleware } from "~/middleware/rolling-cookie.server";
 *
 * export const unstable_middleware = [rollingCookieMiddleware];
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
import type { Cookie, unstable_MiddlewareFunction } from "react-router";
import { rollingCookie } from "../rolling-cookie.js";

/**
 * @param options Options for the middleware
 * @param options.cookie The cookie to use for rolling
 * @returns A middleware function that keeps the cookie alive
 * @example
 * import { unstable_createRollingCookieMiddleware } from "remix-utils/middleware/rolling-cookie";
 *
 * // This must be a Cookie or TypedCookie instance
 * import { cookie } from "~/cookies";
 *
 * export const [rollingCookieMiddleware] = unstable_createRollingCookieMiddleware(
 *   { cookie }
 * );
 */
export function unstable_createRollingCookieMiddleware(
	options: unstable_createRollingCookieMiddleware.Options,
): unstable_createRollingCookieMiddleware.ReturnType {
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
 * `unstable_createRollingCookieMiddleware` function.
 * @see {@link unstable_createRollingCookieMiddleware}
 * @example
 * import { unstable_createRollingCookieMiddleware } from "remix-utils/middleware/rolling-cookie";
 *
 * let options: unstable_createRollingCookieMiddleware.Options;
 * let returnType: unstable_createRollingCookieMiddleware.ReturnType;
 */
export namespace unstable_createRollingCookieMiddleware {
	/**
	 * The options accepted by the `unstable_createRollingCookieMiddleware` function.
	 * @see {@link unstable_createRollingCookieMiddleware}
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
	 * The return type of the `unstable_createRollingCookieMiddleware` function.
	 * @see {@link unstable_createRollingCookieMiddleware}
	 */
	export type ReturnType = [unstable_MiddlewareFunction<Response>];
}
