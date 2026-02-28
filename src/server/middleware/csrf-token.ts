/**
 * The CSRF Token middleware protects your application from Cross-Site Request
 * Forgery attacks by using a token-based approach where a random token is
 * stored in a cookie and must be included in form submissions.
 *
 * > **Note:** This depends on `@oslojs/crypto`, `@oslojs/encoding`, and
 * > React Router.
 *
 * ```ts
 * import { createCsrfTokenMiddleware } from "remix-utils/middleware/csrf-token";
 * import { createCookie } from "react-router";
 *
 * let cookie = createCookie("csrf", {
 *   path: "/",
 *   httpOnly: true,
 *   secure: process.env.NODE_ENV === "production",
 *   sameSite: "lax",
 * });
 *
 * export const [csrfTokenMiddleware, getCsrfToken] = createCsrfTokenMiddleware({
 *   cookie,
 * });
 * ```
 *
 * To use it, you need to add it to the `middleware` array in your
 * `app/root.tsx` file.
 *
 * ```ts
 * import { csrfTokenMiddleware } from "~/middleware/csrf-token.server";
 * export const middleware: Route.MiddlewareFunction[] = [csrfTokenMiddleware];
 * ```
 *
 * Use the `getCsrfToken` function in your root loader to retrieve the token
 * and pass it to your forms:
 *
 * ```ts
 * import { getCsrfToken } from "~/middleware/csrf-token.server";
 *
 * export async function loader({ context }: Route.LoaderArgs) {
 *   let csrfToken = getCsrfToken(context);
 *   return { csrfToken };
 * }
 * ```
 *
 * You can use this with the `AuthenticityTokenProvider` and
 * `AuthenticityTokenInput` components from `remix-utils/csrf/react`:
 *
 * ```tsx
 * import { AuthenticityTokenProvider } from "remix-utils/csrf/react";
 *
 * export default function App({ loaderData }: Route.ComponentProps) {
 *   return (
 *     <AuthenticityTokenProvider token={loaderData.csrfToken}>
 *       <Outlet />
 *     </AuthenticityTokenProvider>
 *   );
 * }
 * ```
 *
 * Then in your forms:
 *
 * ```tsx
 * import { AuthenticityTokenInput } from "remix-utils/csrf/react";
 *
 * function MyForm() {
 *   return (
 *     <Form method="post">
 *       <AuthenticityTokenInput />
 *     </Form>
 *   );
 * }
 * ```
 *
 * The middleware will automatically validate the token on non-safe requests
 * (POST, PUT, DELETE, PATCH) and reject requests with invalid or missing
 * tokens with a 403 Forbidden response.
 *
 * You can customize the middleware behavior:
 *
 * ```ts
 * let [csrfTokenMiddleware, getCsrfToken] = createCsrfTokenMiddleware({
 *   cookie,
 *   // The name of the form field containing the token (default: "csrf")
 *   formDataKey: "csrf",
 *   // A secret to sign the token for extra security
 *   secret: process.env.CSRF_SECRET,
 *   // Custom handler for invalid tokens
 *   onInvalidToken(error, request, context) {
 *     return new Response("Invalid CSRF token", { status: 403 });
 *   },
 * });
 * ```
 *
 * You can allow cross-site requests from specific trusted origins to bypass
 * token validation:
 *
 * ```ts
 * let [csrfTokenMiddleware, getCsrfToken] = createCsrfTokenMiddleware({
 *   cookie,
 *   origin: "https://trusted.com",
 * });
 * ```
 *
 * Or using a RegExp for pattern matching:
 *
 * ```ts
 * let [csrfTokenMiddleware, getCsrfToken] = createCsrfTokenMiddleware({
 *   cookie,
 *   origin: /\.trusted\.com$/,
 * });
 * ```
 *
 * Or using an array of strings and RegExps:
 *
 * ```ts
 * let [csrfTokenMiddleware, getCsrfToken] = createCsrfTokenMiddleware({
 *   cookie,
 *   origin: ["https://trusted1.com", "https://trusted2.com", /\.trusted\.com$/],
 * });
 * ```
 *
 * Or using a function for dynamic validation:
 *
 * ```ts
 * let [csrfTokenMiddleware, getCsrfToken] = createCsrfTokenMiddleware({
 *   cookie,
 *   origin: async (origin, request, context) => {
 *     return await checkOriginInDatabase(origin);
 *   },
 * });
 * ```
 *
 * > **Note:** If you add this middleware to the root route, it will apply to
 * > every route in your application. If your app has API routes that should
 * > accept cross-site requests (e.g., for webhooks or third-party integrations),
 * > you should move the CSRF middleware to a layout route that wraps only your
 * > UI routes, leaving API routes unprotected by CSRF validation.
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Middleware/CSRF-Token
 */
import type {
	Cookie,
	MiddlewareFunction,
	RouterContextProvider,
} from "react-router";
import { createContext } from "react-router";
import { CSRF, CSRFError } from "../csrf.js";
import type { MiddlewareGetter } from "./utils.js";

/**
 * Creates a CSRF token middleware that validates requests using a token stored
 * in a cookie and submitted in form data.
 * @param options Configuration options for CSRF token validation.
 * @returns A tuple containing the middleware function and a getter for the token.
 */
export function createCsrfTokenMiddleware(
	options: createCsrfTokenMiddleware.Options,
): createCsrfTokenMiddleware.ReturnType {
	let csrf = new CSRF({
		cookie: options.cookie,
		formDataKey: options.formDataKey,
		secret: options.secret,
	});

	let safeMethods = new Set(options.safeMethods ?? ["GET", "HEAD", "OPTIONS"]);

	let tokenContext = createContext<string>();

	return [
		async function csrfTokenMiddleware({ request, context }, next) {
			let [token, cookieHeader] = await csrf.commitToken(request);

			context.set(tokenContext, token);

			if (safeMethods.has(request.method.toUpperCase())) {
				let response = await next();
				if (cookieHeader) response.headers.append("Set-Cookie", cookieHeader);
				return response;
			}

			if (!isFormData(request)) {
				let response = await next();
				if (cookieHeader) response.headers.append("Set-Cookie", cookieHeader);
				return response;
			}

			if (options.origin) {
				let isTrusted = await isTrustedOrigin(request, context, options.origin);
				if (isTrusted) {
					let response = await next();
					if (cookieHeader) response.headers.append("Set-Cookie", cookieHeader);
					return response;
				}
			}

			try {
				await csrf.validate(request);
			} catch (error) {
				if (error instanceof CSRFError) {
					if (options.onInvalidToken) {
						return options.onInvalidToken(error, request, context);
					}
					throw new Response("Forbidden", { status: 403 });
				}
				throw error;
			}

			let response = await next();
			if (cookieHeader) response.headers.append("Set-Cookie", cookieHeader);
			return response;
		},

		function getCsrfToken(context) {
			return context.get(tokenContext);
		},
	];
}

function isFormData(request: Request): boolean {
	let contentType = request.headers.get("content-type") ?? "";
	if (contentType.includes("multipart/form-data")) return true;
	if (contentType.includes("application/x-www-form-urlencoded")) return true;
	return false;
}

function parseOrigin(value: string | null): string | null {
	if (!value) return null;
	let normalized = value.toLowerCase().trim();
	if (!URL.canParse(normalized)) return null;
	return new URL(normalized).origin;
}

function getRequestOrigin(request: Request): string | null {
	return (
		parseOrigin(request.headers.get("Origin")) ??
		parseOrigin(request.headers.get("Referer")) ??
		parseOrigin(request.referrer)
	);
}

async function isTrustedOrigin(
	request: Request,
	context: Readonly<RouterContextProvider>,
	origin: createCsrfTokenMiddleware.Origin,
): Promise<boolean> {
	let requestOrigin = getRequestOrigin(request);
	if (!requestOrigin) return false;

	if (typeof origin === "function") {
		let result = await origin(requestOrigin, request, context);
		return result === true;
	}

	if (typeof origin === "string") {
		return requestOrigin === origin.toLowerCase();
	}

	if (origin instanceof RegExp) {
		return origin.test(requestOrigin);
	}

	for (let allowedOrigin of origin) {
		if (typeof allowedOrigin === "string") {
			if (requestOrigin === allowedOrigin.toLowerCase()) return true;
		}

		if (allowedOrigin instanceof RegExp) {
			if (allowedOrigin.test(requestOrigin)) return true;
		}
	}

	return false;
}

export namespace createCsrfTokenMiddleware {
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
	 * Function type for handling requests with invalid CSRF tokens.
	 * @param error The CSRFError that occurred.
	 * @param request The request object.
	 * @param context The router context.
	 * @returns A Response to send to the client.
	 */
	export type InvalidTokenHandler = (
		error: CSRFError,
		request: Request,
		context: Readonly<RouterContextProvider>,
	) => Response | Promise<Response>;

	/**
	 * Configuration options for the CSRF token middleware.
	 */
	export interface Options {
		/**
		 * The cookie object to use for storing the CSRF token.
		 * Should be configured with httpOnly, secure (in production), and
		 * sameSite: "lax" or "strict".
		 */
		cookie: Cookie;

		/**
		 * The name of the form field containing the CSRF token.
		 * @default "csrf"
		 */
		formDataKey?: string;

		/**
		 * A secret to sign the CSRF token for extra security.
		 * When provided, tokens are signed and validated against tampering.
		 */
		secret?: string;

		/**
		 * HTTP methods that bypass CSRF validation. These methods are considered
		 * safe because they should not cause side effects.
		 * @default ["GET", "HEAD", "OPTIONS"]
		 */
		safeMethods?: RequestMethod[];

		/**
		 * Trusted origins that bypass CSRF token validation.
		 *
		 * When a request comes from a trusted origin, the middleware skips token
		 * validation and allows the request through. This is useful for allowing
		 * cross-site form submissions from specific trusted domains.
		 *
		 * The origin is extracted from (in order): `Origin` header, `Referer`
		 * header, or `request.referrer` property.
		 *
		 * - String: exact match (case-insensitive)
		 * - RegExp: pattern match against the origin
		 * - Array: matches if any element matches
		 * - Function: custom validation logic with access to request and context
		 */
		origin?: Origin;

		/**
		 * Custom handler for requests with invalid CSRF tokens.
		 * Use this to log attempts, return custom error responses, or implement
		 * additional security measures.
		 * @default Throws a 403 Forbidden response.
		 */
		onInvalidToken?: InvalidTokenHandler;
	}

	export type ReturnType = [
		MiddlewareFunction<Response>,
		MiddlewareGetter<string>,
	];
}
