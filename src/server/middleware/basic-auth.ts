import { sha256 } from "@oslojs/crypto/sha2";
import { decodeBase64 } from "@oslojs/encoding";
import {
	type unstable_MiddlewareFunction,
	type unstable_RouterContextProvider,
	unstable_createContext,
} from "react-router";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const CREDENTIALS_REGEXP =
	/^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/;
const USER_PASS_REGEXP = /^([^:]*):(.*)$/;

export function unstable_createBasicAuthMiddleware(
	options: unstable_createBasicAuthMiddleware.Options,
): unstable_createBasicAuthMiddleware.ReturnType {
	const userInOptions = "user" in options;
	const verifyUserInOptions = "verifyUser" in options;

	if (!(userInOptions || verifyUserInOptions)) {
		throw new Error(
			'unstable_createBasicAuthMiddleware requires options for "username and password" or "verifyUser"',
		);
	}

	const realm = (options.realm ?? "Secure Area").replace(/"/g, '\\"');

	const userContext = unstable_createContext<string>();

	return [
		async function basicAuthMiddleware({ request, context }, next) {
			let authorization = getAuthorization(request);

			if (!authorization) {
				throw Response.json(await getInvalidUserMessage({ request, context }), {
					status: 401,
					statusText: "Unauthorized",
					headers: { "WWW-Authenticate": `Basic realm="${realm}"` },
				});
			}

			let { username, password } = authorization;

			if (!username || !password) {
				throw Response.json(await getInvalidUserMessage({ request, context }), {
					status: 401,
					statusText: "Unauthorized",
					headers: { "WWW-Authenticate": `Basic realm="${realm}"` },
				});
			}

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
						if (user.username === username && user.password === password) {
							if (await validateCredentials(user, username, password)) {
								context.set(userContext, username);
								return await next();
							}
						}
					}
				} else {
					if (await validateCredentials(options.user, username, password)) {
						context.set(userContext, username);
						return await next();
					}
				}
			}

			throw Response.json(await getInvalidUserMessage({ request, context }), {
				status: 401,
				statusText: "Unauthorized",
				headers: {
					"WWW-Authenticate": `Basic realm="${realm}"`,
				},
			});
		},

		function getUser(context) {
			return context.get(userContext);
		},
	];

	async function getInvalidUserMessage(args: {
		request: Request;
		context: unstable_RouterContextProvider;
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
		user: unstable_createBasicAuthMiddleware.User,
		username: string,
		password: string,
	) {
		let [usernameEqual, passwordEqual] = await Promise.all([
			timingSafeEqual(user.username, username, options.hashFunction),
			timingSafeEqual(user.password, password, options.hashFunction),
		]);

		return usernameEqual && passwordEqual;
	}
}

export namespace unstable_createBasicAuthMiddleware {
	export type Args = {
		request: Request;
		context: unstable_RouterContextProvider;
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
		middleware: unstable_MiddlewareFunction<Response>,
		(context: unstable_RouterContextProvider) => User["username"],
	];

	export type HashFunction = (data: Uint8Array) => Uint8Array;
}

async function timingSafeEqual(
	a: string | object | boolean,
	b: string | object | boolean,
	hashFunction?: unstable_createBasicAuthMiddleware.HashFunction,
): Promise<boolean> {
	// biome-ignore lint/style/noParameterAssign: This is ok
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
