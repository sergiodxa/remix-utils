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
 * export default function Root() {
 *   let { csrfToken } = useLoaderData<typeof loader>();
 *   return (
 *     <AuthenticityTokenProvider token={csrfToken}>
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
 *       {/* other form fields *\/}
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
			// Get or generate the token
			let [token, cookieHeader] = await csrf.commitToken(request);

			// Store token in context for loaders to access
			context.set(tokenContext, token);

			// Skip validation for safe methods
			if (safeMethods.has(request.method.toUpperCase())) {
				let response = await next();
				// Set the cookie if it's new
				if (cookieHeader) {
					response.headers.append("Set-Cookie", cookieHeader);
				}
				return response;
			}

			// Only validate form submissions
			if (!isFormData(request)) {
				let response = await next();
				if (cookieHeader) {
					response.headers.append("Set-Cookie", cookieHeader);
				}
				return response;
			}

			// Validate the token
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
			if (cookieHeader) {
				response.headers.append("Set-Cookie", cookieHeader);
			}
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
