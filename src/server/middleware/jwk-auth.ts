/**
 * > This depends on `@edgefirst-dev/jwt`.
 *
 * The JWK Auth middleware let's you add a JSON Web Key authentication to your routes, this can be useful to protect routes that need to be private and will be accessed by other services.
 *
 * > **Warning**: JWK Auth is more secure than Basic Auth, but it should be used with HTTPS to ensure the token is encrypted.
 *
 * ```ts
 * import { createJWKAuthMiddleware } from "remix-utils/middleware/jwk-auth";
 *
 * export const [jwkAuthMiddleware, getJWTPayload] =
 *   createJWKAuthMiddleware({
 *     jwksUri: "https://auth.example.com/.well-known/jwks.json",
 *   });
 * ```
 *
 * The `jwksUri` option let's you set the URL to the JWKS endpoint, this is the URL where the public keys are stored.
 *
 * To use the middleware, you need to add it to the `middleware` array in the route where you want to use it.
 *
 * ```ts
 * import { jwkAuthMiddleware } from "~/middleware/jwk-auth";
 * export const middleware: Route.MiddlewareFunction[] = [jwkAuthMiddleware];
 * ```
 *
 * Now, when you access the route it will check the JWT token in the `Authorization` header.
 *
 * In case of an invalid token the middleware will return a `401` status code with a `WWW-Authenticate` header.
 *
 * ```http
 * HTTP/1.1 401 Unauthorized
 * WWW-Authenticate: Bearer realm="Secure Area"
 *
 * Unauthorized
 * ```
 *
 * The `realm` option let's you set the realm for the authentication, this is the name of the protected area.
 *
 * ```ts
 * import { createJWKAuthMiddleware } from "remix-utils/middleware/jwk-auth";
 *
 * export const [jwkAuthMiddleware] = createJWKAuthMiddleware({
 *   realm: "My Realm",
 *   jwksUri: "https://auth.example.com/.well-known/jwks.json",
 * });
 * ```
 *
 * If you want to customize the message sent when the token is invalid you can use the `invalidTokenMessage` option.
 *
 * ```ts
 * import { createJWKAuthMiddleware } from "remix-utils/middleware/jwk-auth";
 *
 * export const [jwkAuthMiddleware] = createJWKAuthMiddleware({
 *   invalidTokenMessage: "Invalid token",
 *   jwksUri: "https://auth.example.com/.well-known/jwks.json",
 * });
 * ```
 *
 * And this will be the response when the token is invalid.
 *
 * ```http
 * HTTP/1.1 401 Unauthorized
 * WWW-Authenticate: Bearer realm="Secure Area"
 *
 * Invalid token
 * ```
 *
 * You can also customize the `invalidTokenMessage` by passing a function which will receive the Request and context objects.
 *
 * ```ts
 * import { createJWKAuthMiddleware } from "remix-utils/middleware/jwk-auth";
 *
 * export const [jwkAuthMiddleware] = createJWKAuthMiddleware({
 *   invalidTokenMessage({ request, context }) {
 *     // do something with request or context here
 *     return { message: `Invalid token` };
 *   },
 *   jwksUri: "https://auth.example.com/.well-known/jwks.json",
 * });
 * ```
 *
 * In both cases, with a hard-coded value or a function, the invalid message can be a string or an object, if it's an object it will be converted to JSON.
 *
 * ```http
 * HTTP/1.1 401 Unauthorized
 * WWW-Authenticate: Bearer realm="Secure Area"
 *
 * {"message":"Invalid token"}
 * ```
 *
 * If you want to get the JWT payload in your loaders, actions, or other middleware you can use the `getJWTPayload` function.
 *
 * ```ts
 * import { getJWTPayload } from "~/middleware/jwk-auth.server";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 *   let payload = getJWTPayload();
 *   // ...
 * }
 * ```
 *
 * And you can use the payload to get the subject, scope, issuer, audience, or any other information stored in the token.
 *
 * ## With a Custom Header
 *
 * If your app receives the JWT in a custom header instead of the `Authorization` header you can tell the middleware to look for the token in that header.
 *
 * ```ts
 * import { createJWKAuthMiddleware } from "remix-utils/middleware/jwk-auth";
 *
 * export const [jwkAuthMiddleware, getJWTPayload] =
 *   createJWKAuthMiddleware({ header: "X-API-Key" });
 * ```
 *
 * Now use the middleware as usual, but now instead of looking for the token in the `Authorization` header it will look for it in the `X-API-Key` header.
 *
 * ```ts
 * import { jwkAuthMiddleware } from "~/middleware/jwk-auth";
 *
 * export const middleware: Route.MiddlewareFunction[] = [jwkAuthMiddleware];
 * ```
 *
 * ## With a Cookie
 *
 * If you save a JWT in a cookie using React Router's Cookie API, you can tell the middleware to look for the token in the cookie instead of the `Authorization` header.
 *
 * ```ts
 * import { createJWKAuthMiddleware } from "remix-utils/middleware/jwk-auth";
 * import { createCookie } from "react-router";
 *
 * export const cookie = createCookie("jwt", {
 *   path: "/",
 *   sameSite: "lax",
 *   httpOnly: true,
 *   secure: process.env.NODE_ENV === "true",
 * });
 *
 * export const [jwkAuthMiddleware, getJWTPayload] =
 *   createJWKAuthMiddleware({ cookie });
 * ```
 *
 * Then use the middleware as usual, but now instead of looking for the token in the `Authorization` header it will look for it in the cookie.
 *
 * ```ts
 * import { jwkAuthMiddleware } from "~/middleware/jwk-auth";
 *
 * export const middleware: Route.MiddlewareFunction[] = [jwkAuthMiddleware];
 * ```
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Middleware/JWK Auth
 */
import { JWK, JWT } from "@edgefirst-dev/jwt";
import {
	type Cookie,
	createContext,
	type MiddlewareFunction,
	RouterContextProvider,
} from "react-router";
import type { MiddlewareGetter } from "./utils.js";

export function createJWKAuthMiddleware({
	jwksUri,
	realm = "Secure Area",
	alg = JWK.Algoritm.ES256,
	invalidUserMessage = "Unauthorized",
	...options
}: createBearerAuthMiddleware.Options): createBearerAuthMiddleware.ReturnType {
	const tokenContext = createContext<JWT>();
	const remote = JWK.importRemote(new URL(jwksUri), { alg });

	const cookieInOptions = "cookie" in options;

	return [
		async function jwkAuthMiddleware({ request, context }, next) {
			let token: string | null = null;

			if (cookieInOptions) {
				token = await options.cookie.parse(request.headers.get("Cookie"));
			}

			if (!cookieInOptions) {
				let authorization = request.headers.get(
					options.headerName ?? "Authorization",
				);

				if (!authorization) throw await unauthorized(request, context);

				let [type, ...rest] = authorization.split(" ");

				if (type?.toLowerCase() !== "bearer") {
					throw await unauthorized(request, context);
				}

				token = rest[0] ?? null;
			}

			if (!token) throw await unauthorized(request, context);

			try {
				context.set(
					tokenContext,
					await JWT.verify(token, await remote, options.verifyOptions),
				);
			} catch {
				throw await unauthorized(request, context);
			}

			return await next();
		},

		function getJWTPayload(context) {
			return context.get(tokenContext);
		},
	];

	async function getInvalidUserMessage(args: {
		request: Request;
		context: Readonly<RouterContextProvider>;
	}): Promise<string | object> {
		if (invalidUserMessage === undefined) return "Unauthorized";
		if (typeof invalidUserMessage === "string") return invalidUserMessage;
		if (typeof invalidUserMessage === "function") {
			return await invalidUserMessage(args);
		}
		return invalidUserMessage;
	}

	async function unauthorized(
		request: Request,
		context: Readonly<RouterContextProvider>,
	) {
		let message = await getInvalidUserMessage({ request, context });
		return Response.json(message, {
			status: 401,
			statusText: "Unauthorized",
			headers: { "WWW-Authenticate": `Bearer realm="${realm}"` },
		});
	}
}

export namespace createBearerAuthMiddleware {
	export type Args = {
		request: Request;
		context: Readonly<RouterContextProvider>;
	};

	export type MessageFunction = (
		args: Args,
	) => string | object | Promise<string | object>;

	export interface BaseOptions {
		/**
		 * The URL of the JWKS endpoint.
		 * @example
		 * "https://auth.example.com/.well-known/jwks.json"
		 */
		jwksUri: ConstructorParameters<typeof URL>[0];

		/**
		 * The algorithm to use for verifying the JWT signature.
		 * @default "ES256"
		 */
		alg?: JWK.Algoritm;

		/**
		 * The message to return when the user is invalid.
		 *
		 * If a function is provided, it will be called with the request and context
		 * as arguments.
		 *
		 * If the function returns a string, it will be used as the message.
		 *
		 * If the function returns an object, it will be serialized as JSON and used
		 * as the response body.
		 *
		 * @default "Unauthorized"
		 * @example
		 * "Invalid user"
		 * (args) => `Invalid user: ${args.request.headers.get("X-User")}`
		 * async (args) => {
		 *  let user = await getUser(args.context);
		 *  return `Invalid user: ${user}`;
		 * }
		 * { error: "Invalid user" }
		 * (args) => ({
		 *   error: `Invalid user: ${args.request.headers.get("X-User")}`
		 * })
		 * async (args) => {
		 *  let user = await getUser(args.context);
		 *  return { error: `Invalid user: ${user}` };
		 * }
		 */
		invalidUserMessage?: string | object | MessageFunction;

		/**
		 * The domain name of the realm, as part of the returned WWW-Authenticate
		 * challenge header.
		 *
		 * @default "Secure Area"
		 */
		realm?: string;

		verifyOptions?: JWT.VerifyOptions;
	}

	export interface HeaderOptions extends BaseOptions {
		/**
		 * The name of the header to use for the bearer token.
		 * @default "Authorization"
		 */
		headerName?: string;
	}

	export interface CookieOptions extends BaseOptions {
		/**
		 * The cookie to use for the bearer token.
		 *
		 * If provided the cookie will be parsed to try to extract the JWT.
		 */
		cookie: Cookie;
	}

	export type Options = HeaderOptions | CookieOptions;

	export type ReturnType = [
		MiddlewareFunction<Response>,
		MiddlewareGetter<JWT>,
	];
}
