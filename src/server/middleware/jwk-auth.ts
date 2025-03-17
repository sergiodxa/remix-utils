import { JWK, JWT } from "@edgefirst-dev/jwt";
import {
	type Cookie,
	type unstable_MiddlewareFunction,
	unstable_RouterContextProvider,
	unstable_createContext,
} from "react-router";

export function unstable_createJWKAuthMiddleware({
	jwksUri,
	realm = "Secure Area",
	alg = JWK.Algoritm.ES256,
	invalidUserMessage = "Unauthorized",
	...options
}: unstable_createBearerAuthMiddleware.Options): unstable_createBearerAuthMiddleware.ReturnType {
	const tokenContext = unstable_createContext<JWT>();
	const remote = JWK.importRemote(new URL(jwksUri), { alg });

	const cookieInOptions = "cookie" in options;
	const headerInOptions = "headerName" in options;

	return [
		async function jwkAuthMiddleware({ request, context }, next) {
			let token: string | null = null;

			if (headerInOptions) {
				let authorization = request.headers.get(options.headerName);
				if (!authorization) throw await unauthorized(request, context);

				let type = authorization[0];
				if (type !== "Bearer") throw await unauthorized(request, context);

				token = authorization[1] ?? null;
				if (!token) throw await unauthorized(request, context);
			}

			if (cookieInOptions) {
				token = await options.cookie.parse(request.headers.get("Cookie"));
				if (!token) throw await unauthorized(request, context);
			}

			context.set(
				tokenContext,
				await JWT.verify("token", await remote, options),
			);

			return await next();
		},

		function getJWTPayload(context) {
			return context.get(tokenContext);
		},
	];

	async function getInvalidUserMessage(args: {
		request: Request;
		context: unstable_RouterContextProvider;
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
		context: unstable_RouterContextProvider,
	) {
		let message = await getInvalidUserMessage({ request, context });
		return Response.json(message, {
			status: 401,
			statusText: "Unauthorized",
			headers: { "WWW-Authenticate": `Bearer realm="${realm}"` },
		});
	}
}

export namespace unstable_createBearerAuthMiddleware {
	export type Args = {
		request: Request;
		context: unstable_RouterContextProvider;
	};

	export type MessageFunction = (
		args: Args,
	) => string | object | Promise<string | object>;

	export interface BaseOptions extends Omit<JWT.VerifyOptions, "algorithm"> {
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
		headerName: string;
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
		unstable_MiddlewareFunction<Response>,
		(context: unstable_RouterContextProvider) => JWT,
	];
}
