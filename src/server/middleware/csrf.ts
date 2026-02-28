/**
 * The CSRF middleware protects your application from Cross-Site Request
 * Forgery attacks by validating that requests originate from trusted sources.
 *
 * ```ts
 * import { createCsrfMiddleware } from "remix-utils/middleware/csrf";
 *
 * export const csrf = createCsrfMiddleware();
 * ```
 *
 * To use it, you need to add it to the `middleware` array in your
 * `app/root.tsx` file.
 *
 * ```ts
 * import { csrf } from "~/middleware/csrf.server";
 * export const middleware: Route.MiddlewareFunction[] = [csrf];
 * ```
 *
 * Now, every non-safe request will be validated against CSRF attacks.
 *
 * > **Note:** If you add this middleware to the root route, it will apply to
 * > every route in your application. If your app has API routes that should
 * > accept cross-site requests (e.g., for webhooks or third-party integrations),
 * > you should move the CSRF middleware to a layout route that wraps only your
 * > UI routes, leaving API routes unprotected by CSRF validation.
 *
 * The middleware uses the `Sec-Fetch-Site` header to determine request origin.
 * Requests from `same-origin` or `same-site` are automatically allowed. For
 * `cross-site` requests, you can specify trusted origins to allow.
 *
 * The request origin is determined by checking (in order):
 * 1. The `Origin` header
 * 2. The `Referer` header
 * 3. The `request.referrer` property
 *
 * The CSRF middleware can be customized by passing an options object to the
 * `createCsrfMiddleware` function.
 *
 * You can allow cross-site requests from specific origins using a string:
 *
 * ```ts
 * let csrf = createCsrfMiddleware({
 *   origin: "https://trusted.com",
 * });
 * ```
 *
 * Or using a RegExp for pattern matching:
 *
 * ```ts
 * let csrf = createCsrfMiddleware({
 *   origin: /\.trusted\.com$/,
 * });
 * ```
 *
 * Or using an array of strings and RegExps:
 *
 * ```ts
 * let csrf = createCsrfMiddleware({
 *   origin: ["https://trusted1.com", "https://trusted2.com", /\.trusted\.com$/],
 * });
 * ```
 *
 * Or using a function for dynamic validation:
 *
 * ```ts
 * let csrf = createCsrfMiddleware({
 *   origin: (origin, request, context) => origin === "https://trusted.com",
 * });
 * ```
 *
 * The function can also be async:
 *
 * ```ts
 * let csrf = createCsrfMiddleware({
 *   origin: async (origin, request, context) => {
 *     return await checkOriginInDatabase(origin);
 *   },
 * });
 * ```
 *
 * You can customize which HTTP methods skip CSRF validation:
 *
 * ```ts
 * let csrf = createCsrfMiddleware({
 *   safeMethods: ["GET", "HEAD", "OPTIONS", "POST"],
 * });
 * ```
 *
 * You can allow requests with missing or invalid origin headers:
 *
 * ```ts
 * let csrf = createCsrfMiddleware({
 *   origin: "https://trusted.com",
 *   allowMissingOrigin: true,
 * });
 * ```
 *
 * You can provide a custom handler for untrusted requests:
 *
 * ```ts
 * let csrf = createCsrfMiddleware({
 *   onUntrustedRequest(request, context) {
 *     return new Response("Custom forbidden", { status: 418 });
 *   },
 * });
 * ```
 *
 * By default, untrusted requests will receive a 403 Forbidden response.
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Middleware/CSRF
 */
import type { MiddlewareFunction, RouterContextProvider } from "react-router";
import { fetchSite } from "../sec-fetch.js";

/**
 * Creates a CSRF protection middleware that validates requests originate from
 * trusted sources using the `Sec-Fetch-Site` header.
 * @param options Configuration options for CSRF validation behavior.
 * @returns A middleware function that validates requests against CSRF attacks.
 */
export function createCsrfMiddleware(
	options: createCsrfMiddleware.Options = {},
): MiddlewareFunction<Response> {
	let safeMethods = new Set(options.safeMethods ?? ["GET", "HEAD", "OPTIONS"]);

	return async ({ request, context }, next) => {
		if (safeMethods.has(request.method.toUpperCase())) return await next();

		let site = fetchSite(request);

		if (site === "same-origin" || site === "same-site") return await next();

		if (site === null && options.allowMissingOrigin) return await next();

		if (site === "cross-site" && options.origin) {
			let origin = getRequestOrigin(request);

			if (!origin && options.allowMissingOrigin) return await next();

			if (!origin) {
				if (options.onUntrustedRequest) {
					return options.onUntrustedRequest(request, context);
				}
				throw new Response("Forbidden", { status: 403 });
			}

			if (typeof options.origin === "function") {
				let result = await options.origin(origin, request, context);
				if (result) return await next();
			} else if (typeof options.origin === "string") {
				if (origin === options.origin.toLowerCase()) return await next();
			} else if (options.origin instanceof RegExp) {
				if (options.origin.test(origin)) return await next();
			} else {
				for (let allowedOrigin of options.origin) {
					if (typeof allowedOrigin === "string") {
						if (origin === allowedOrigin.toLowerCase()) return await next();
					}

					if (allowedOrigin instanceof RegExp) {
						if (allowedOrigin.test(origin)) return await next();
					}
				}
			}
		}

		if (options.onUntrustedRequest) {
			return options.onUntrustedRequest(request, context);
		}

		throw new Response("Forbidden", { status: 403 });
	};
}

export namespace createCsrfMiddleware {
	/**
	 * HTTP request methods that can be configured as safe (exempt from CSRF
	 * validation). Must be uppercase.
	 */
	export type RequestMethod =
		| "GET"
		| "HEAD"
		| "OPTIONS"
		| "POST"
		| "PUT"
		| "DELETE"
		| "PATCH";

	/**
	 * Static origin matching pattern. Can be a single string, a RegExp, or an
	 * array combining both for matching multiple origins.
	 *
	 * > **Warning:** Avoid using the global flag (`g`) on RegExp patterns.
	 * > The `.test()` method on global regexes is stateful (it updates
	 * > `lastIndex`), which can cause inconsistent matching results across
	 * > requests.
	 */
	export type OriginMatcher = string | RegExp | ReadonlyArray<string | RegExp>;

	/**
	 * Return type for the origin resolver function.
	 * - `true` allows the request
	 * - `false`, `null`, or `undefined` rejects the request
	 */
	export type OriginResolverResult = boolean | null | undefined;

	/**
	 * Function type for dynamically validating request origins.
	 * @param origin The origin extracted from the request's Origin header,
	 *   Referer header, or referrer property.
	 * @param request The incoming request object.
	 * @param context The router context for accessing app-specific data.
	 * @returns Whether to allow the request. Return `true` to allow, or `false`,
	 *   `null`, or `undefined` to reject. Can be async.
	 */
	export type OriginResolver = (
		origin: string,
		request: Request,
		context: Readonly<RouterContextProvider>,
	) => OriginResolverResult | Promise<OriginResolverResult>;

	/**
	 * Origin validation configuration. Can be a static matcher pattern or a
	 * dynamic resolver function for complex validation logic.
	 */
	export type Origin = OriginMatcher | OriginResolver;

	/**
	 * Function type for handling requests that fail CSRF validation.
	 * @param request The rejected request object.
	 * @param context The router context for accessing app-specific data.
	 * @returns A Response to send to the client. Can be async.
	 */
	export type UntrustedRequestHandler = (
		request: Request,
		context: Readonly<RouterContextProvider>,
	) => Response | Promise<Response>;

	/**
	 * Configuration options for the CSRF middleware.
	 */
	export interface Options {
		/**
		 * HTTP methods that bypass CSRF validation. These methods are considered
		 * safe because they should not cause side effects.
		 * Must be uppercase (e.g., "GET", not "get").
		 * @default ["GET", "HEAD", "OPTIONS"]
		 */
		safeMethods?: RequestMethod[];

		/**
		 * Trusted origins allowed for cross-site requests.
		 *
		 * When a request has `Sec-Fetch-Site: cross-site`, the middleware checks
		 * the request origin against this configuration:
		 * - String: exact match (case-insensitive)
		 * - RegExp: pattern match against the origin
		 * - Array: matches if any element matches
		 * - Function: custom validation logic with access to request and context
		 *
		 * The origin is extracted from (in order): `Origin` header, `Referer`
		 * header, or `request.referrer` property.
		 *
		 * If not specified, all cross-site requests are rejected.
		 */
		origin?: Origin;

		/**
		 * Whether to allow requests when the origin cannot be determined (missing
		 * `Origin` header, `Referer` header, and `request.referrer` property) or
		 * cannot be parsed as a valid URL.
		 * @default false
		 */
		allowMissingOrigin?: boolean;

		/**
		 * Custom handler for requests that fail CSRF validation.
		 * Use this to log attempts, return custom error responses, or implement
		 * additional security measures.
		 * @param request The rejected request.
		 * @param context The router context.
		 * @returns A Response to send to the client.
		 * @default Throws a 403 Forbidden response.
		 */
		onUntrustedRequest?: UntrustedRequestHandler;
	}
}

/**
 * Parses a URL string and returns its origin, or `null` if invalid.
 * @param value The URL string to parse.
 * @returns The origin if valid, or `null` if empty or unparseable.
 * @private
 */
function parseOrigin(value: string | null): string | null {
	if (!value) return null;
	let normalized = value.toLowerCase().trim();
	if (!URL.canParse(normalized)) return null;
	return new URL(normalized).origin;
}

/**
 * Extracts the origin from a request by checking multiple sources in order:
 * 1. The `Origin` header
 * 2. The `Referer` header
 * 3. The `request.referrer` property
 *
 * @param request The incoming request object.
 * @returns The origin string if found and valid, or `null` if not available or unparseable.
 * @private
 */
function getRequestOrigin(request: Request): string | null {
	return (
		parseOrigin(request.headers.get("Origin")) ??
		parseOrigin(request.headers.get("Referer")) ??
		parseOrigin(request.referrer)
	);
}
