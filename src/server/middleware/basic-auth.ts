/**
 *> This depends on `@oslojs/crypto`, and `@oslojs/encoding`.
 *
 * The Basic Auth middleware let's you add a basic authentication to your
 * routes, this can be useful to protect routes that need to be private.
 *
 * > **Warning**: Basic Auth is not secure by itself, it should be used with
 * > HTTPS to ensure the username and password are encrypted. Do not use it to
 * > protect sensitive data, use a more secure method instead.
 *
 * ```ts
 * import { createBasicAuthMiddleware } from "remix-utils/middleware/basic-auth";
 *
 * export const [basicAuthMiddleware] = createBasicAuthMiddleware({
 *   user: { username: "admin", password: "password" },
 * });
 * ```
 *
 * To use it, you need to add it to the `middleware` array in the
 * route where you want to use it.
 *
 * ```ts
 * import { basicAuthMiddleware } from "~/middleware/basic-auth.server";
 * export const middleware: Route.MiddlewareFunction[] = [basicAuthMiddleware];
 * ```
 *
 * Now, when you access the route you will be prompted to enter the username and password.
 *
 * The `realm` option let's you set the realm for the authentication, this is the name of the protected area.
 *
 * ```ts
 * import { createBasicAuthMiddleware } from "remix-utils/middleware/basic-auth";
 *
 * export const [basicAuthMiddleware] = createBasicAuthMiddleware({
 *   realm: "My Realm",
 *   user: { username: "admin", password: "password" },
 * });
 * ```
 *
 * The `user` option let's you set the username and password to authenticate,
 * you can also pass an array of users.
 *
 * ```ts
 * import { createBasicAuthMiddleware } from "remix-utils/middleware/basic-auth";
 *
 * export const [basicAuthMiddleware] = createBasicAuthMiddleware({
 *   user: [
 *     { username: "admin", password: "password" },
 *     { username: "user", password: "password" },
 *   ],
 * });
 * ```
 *
 * The `verifyUser` option let's you pass a function to verify the user, this
 * can be useful to check the user against a database.
 *
 * ```ts
 * import { createBasicAuthMiddleware } from "remix-utils/middleware/basic-auth";
 *
 * export const [basicAuthMiddleware] = createBasicAuthMiddleware({
 *   verifyUser(username, password) {
 *     let user = await getUser(username);
 *     if (!user) return false;
 *     return await verifyPassword(password, user.password);
 *   },
 * });
 * ```
 *
 * The `verifyUser` function should return `true` if the user is authenticated,
 * and `false` otherwise.
 *
 * In case of an invalid username or password the middleware will return a
 * `401` status code with a `WWW-Authenticate` header.
 *
 * ```http
 * HTTP/1.1 401 Unauthorized
 * WWW-Authenticate: Basic realm="My Realm"
 *
 * Unauthorized
 * ```
 *
 * The `invalidUserMessage` option let's you customize the message sent when
 * the user is invalid.
 *
 * ```ts
 * import { createBasicAuthMiddleware } from "remix-utils/middleware/basic-auth";
 *
 * export const [basicAuthMiddleware] = createBasicAuthMiddleware({
 *   invalidUserMessage: "Invalid username or password",
 *   user: { username: "admin", password: "password" },
 * });
 * ```
 *
 * And this will be the response when the user is invalid.
 *
 * ```http
 * HTTP/1.1 401 Unauthorized
 * WWW-Authenticate: Basic realm="My Realm"
 *
 * Invalid username or password
 * ```
 *
 * You can also customize the `invalidUserMessage` by passing a function which
 * will receive the Request and context objects.
 *
 * ```ts
 * import { createBasicAuthMiddleware } from "remix-utils/middleware/basic-auth";
 *
 * export const [basicAuthMiddleware] = createBasicAuthMiddleware({
 *   invalidUserMessage({ request, context }) {
 *     // do something with request or context here
 *     return { message: `Invalid username or password for ${username}` };
 *   },
 *   user: { username: "admin", password: "password" },
 * });
 * ```
 *
 * In both cases, with a hard-coded value or a function, the invalid message
 * can be a string or an object, if it's an object it will be converted to JSON.
 *
 * ```http
 * HTTP/1.1 401 Unauthorized
 * WWW-Authenticate: Basic realm="My Realm"
 *
 * {"message":"Invalid username or password"}
 * ```
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Middleware/Basic Auth
 */
import { sha256 } from "@oslojs/crypto/sha2";
import { decodeBase64 } from "@oslojs/encoding";
import {
	createContext,
	type MiddlewareFunction,
	type RouterContextProvider,
} from "react-router";
import type { MiddlewareGetter } from "./utils.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const CREDENTIALS_REGEXP =
	/^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/;
const USER_PASS_REGEXP = /^([^:]*):(.*)$/;

export function createBasicAuthMiddleware(
	options: createBasicAuthMiddleware.Options,
): createBasicAuthMiddleware.ReturnType {
	const userInOptions = "user" in options;
	const verifyUserInOptions = "verifyUser" in options;

	if (!(userInOptions || verifyUserInOptions)) {
		throw new Error(
			'createBasicAuthMiddleware requires options for "username and password" or "verifyUser"',
		);
	}

	const realm = (options.realm ?? "Secure Area")
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"');

	const userContext = createContext<string>();

	return [
		async function basicAuthMiddleware({ request, context }, next) {
			let authorization = getAuthorization(request);
			if (!authorization) throw await unauthorized(request, context);

			let { username, password } = authorization;
			if (!username || !password) throw await unauthorized(request, context);

			if (verifyUserInOptions) {
				let isValid = await options.verifyUser(username, password, {
					request,
					context,
				});

				if (isValid) {
					context.set(userContext, username);
					return await next();
				}
			} else {
				if (Array.isArray(options.user)) {
					for (let user of options.user) {
						if (user.username !== username) continue;
						if (user.password !== password) continue;
						if (await validateCredentials(user, username, password)) {
							context.set(userContext, username);
							return await next();
						}
					}
				} else {
					if (await validateCredentials(options.user, username, password)) {
						context.set(userContext, username);
						return await next();
					}
				}
			}

			throw await unauthorized(request, context);
		},

		function getUser(context) {
			return context.get(userContext);
		},
	];

	async function getInvalidUserMessage(args: {
		request: Request;
		context: Readonly<RouterContextProvider>;
	}): Promise<string | object> {
		let invalidUserMessage = options.invalidUserMessage;
		if (invalidUserMessage === undefined) return "Unauthorized";
		if (typeof invalidUserMessage === "string") return invalidUserMessage;
		if (typeof invalidUserMessage === "function") {
			return await invalidUserMessage(args);
		}
		return invalidUserMessage;
	}

	async function validateCredentials(
		user: createBasicAuthMiddleware.User,
		username: string,
		password: string,
	) {
		let [usernameEqual, passwordEqual] = await Promise.all([
			timingSafeEqual(user.username, username, options.hashFunction),
			timingSafeEqual(user.password, password, options.hashFunction),
		]);

		return usernameEqual && passwordEqual;
	}

	async function unauthorized(
		request: Request,
		context: Readonly<RouterContextProvider>,
	) {
		let message = await getInvalidUserMessage({ request, context });
		return Response.json(message, {
			status: 401,
			statusText: "Unauthorized",
			headers: { "WWW-Authenticate": `Basic realm="${realm}"` },
		});
	}
}

export namespace createBasicAuthMiddleware {
	export type Args = {
		request: Request;
		context: Readonly<RouterContextProvider>;
	};

	export type MessageFunction = (
		args: Args,
	) => string | object | Promise<string | object>;

	interface BaseOptions {
		/**
		 * The domain name of the realm, as part of the returned WWW-Authenticate
		 * challenge header.
		 * @default "Secure Area"
		 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate#directives
		 */
		realm?: string;
		hashFunction?: HashFunction;
		invalidUserMessage?: string | object | MessageFunction;
	}

	export interface User {
		/**
		 * The username of the user who is authenticating.
		 */
		username: string;
		/**
		 * The password value for the provided username to authenticate against.
		 */
		password: string;
	}

	export interface HardCodedUserOptions extends BaseOptions {
		user: User | Array<User>;
	}

	export interface DynamicUserOptions extends BaseOptions {
		verifyUser(
			username: string,
			password: string,
			args: Args,
		): boolean | Promise<boolean>;
	}

	export type Options = HardCodedUserOptions | DynamicUserOptions;

	export type ReturnType = [
		MiddlewareFunction<Response>,
		MiddlewareGetter<User["username"]>,
	];

	export type HashFunction = (data: Uint8Array) => Uint8Array;
}

async function timingSafeEqual(
	a: string | object | boolean,
	b: string | object | boolean,
	hashFunction?: createBasicAuthMiddleware.HashFunction,
): Promise<boolean> {
	if (!hashFunction) hashFunction = sha256;

	let [sa, sb] = await Promise.all([
		hashFunction(encoder.encode(a.toString())),
		hashFunction(encoder.encode(b.toString())),
	]);

	if (!sa || !sb) {
		return false;
	}

	return decoder.decode(sa) === decoder.decode(sb) && a === b;
}

function getAuthorization(
	request: Request,
): { username: string; password: string } | undefined {
	let match = CREDENTIALS_REGEXP.exec(
		request.headers.get("Authorization") || "",
	);

	if (!match) return undefined;

	let userPass: RegExpExecArray | null = null;

	// If an invalid string is passed to atob(), it throws a `DOMException`.
	try {
		userPass = USER_PASS_REGEXP.exec(
			decoder.decode(decodeBase64(match[1] ?? "")),
		);
	} catch {} // Do nothing

	if (!userPass) return undefined;

	let username = userPass[1];
	let password = userPass[2];

	if (!username || !password) return undefined;

	return { username, password };
}
