/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/csrf-server` and `bunx shadcn@latest add @remix-utils/csrf-react`.
 *
 * > [!NOTE]
 * > This depends on `react`, `@oslojs/crypto`, `@oslojs/encoding`, and React Router.
 *
 * The CSRF related functions let you implement CSRF protection on your application.
 *
 * This part of Remix Utils needs React and server-side code.
 *
 * First create a new CSRF instance.
 *
 * ```ts
 * // app/utils/csrf.server.ts
 * import { CSRF } from "remix-utils/csrf/server";
 * import { createCookie } from "react-router"; // or cloudflare/deno
 *
 * export const cookie = createCookie("csrf", {
 * 	path: "/",
 * 	httpOnly: true,
 * 	secure: process.env.NODE_ENV === "production",
 * 	sameSite: "lax",
 * 	secrets: ["s3cr3t"],
 * });
 *
 * export const csrf = new CSRF({
 * 	cookie,
 * 	// what key in FormData objects will be used for the token, defaults to `csrf`
 * 	formDataKey: "csrf",
 * 	// an optional secret used to sign the token, recommended for extra safety
 * 	secret: "s3cr3t",
 * });
 * ```
 *
 * Then you can use `csrf` to generate a new token.
 *
 * ```ts
 * import { csrf } from "~/utils/csrf.server";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	let token = csrf.generate();
 * }
 * ```
 *
 * You can customize the token size by passing the byte size, the default one is 32 bytes which will give you a string with a length of 43 after encoding.
 *
 * ```ts
 * let token = csrf.generate(64); // customize token length
 * ```
 *
 * You will need to save this token in a cookie and also return it from the loader. For convenience, you can use the `CSRF#commitToken` helper.
 *
 * ```ts
 * import { csrf } from "~/utils/csrf.server";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	let [token, cookieHeader] = await csrf.commitToken(request);
 * 	return json({ token }, { headers: { "set-cookie": cookieHeader } });
 * }
 * ```
 *
 * > [!NOTE]
 * > You could do this on any route, but I recommend you to do it on the `root` loader.
 *
 * Now that you returned the token and set it in a cookie, you can use the `AuthenticityTokenProvider` component to provide the token to your React components.
 *
 * ```tsx
 * import { AuthenticityTokenProvider } from "remix-utils/csrf/react";
 *
 * let { csrf } = useLoaderData<LoaderData>();
 * return (
 * 	<AuthenticityTokenProvider token={csrf}>
 * 		<Outlet />
 * 	</AuthenticityTokenProvider>
 * );
 * ```
 *
 * Render it in your `root` component and wrap the `Outlet` with it.
 *
 * When you create a form in some route, you can use the `AuthenticityTokenInput` component to add the authenticity token to the form.
 *
 * ```tsx
 * import { Form } from "react-router";
 * import { AuthenticityTokenInput } from "remix-utils/csrf/react";
 *
 * export default function Component() {
 * 	return (
 * 		<Form method="post">
 * 			<AuthenticityTokenInput />
 * 			<input type="text" name="something" />
 * 		</Form>
 * 	);
 * }
 * ```
 *
 * Note that the authenticity token is only really needed for a form that mutates the data somehow. If you have a search form making a GET request, you don't need to add the authenticity token there.
 *
 * This `AuthenticityTokenInput` will get the authenticity token from the `AuthenticityTokenProvider` component and add it to the form as the value of a hidden input with the name `csrf`. You can customize the field name using the `name` prop.
 *
 * ```tsx
 * <AuthenticityTokenInput name="customName" />
 * ```
 *
 * You should only customize the name if you also changed it on `createAuthenticityToken`.
 *
 * If you need to use `useFetcher` (or `useSubmit`) instead of `Form` you can also get the authenticity token with the `useAuthenticityToken` hook.
 *
 * ```tsx
 * import { useFetcher } from "react-router";
 * import { useAuthenticityToken } from "remix-utils/csrf/react";
 *
 * export function useMarkAsRead() {
 * 	let fetcher = useFetcher();
 * 	let csrf = useAuthenticityToken();
 * 	return function submit(data) {
 * 		fetcher.submit({ csrf, ...data }, { action: "/api/mark-as-read", method: "post" });
 * 	};
 * }
 * ```
 *
 * Finally, you need to validate the authenticity token in the action that received the request.
 *
 * ```ts
 * import { CSRFError } from "remix-utils/csrf/server";
 * import { redirectBack } from "remix-utils/redirect-back";
 * import { csrf } from "~/utils/csrf.server";
 *
 * export async function action({ request }: Route.ActionArgs) {
 * 	try {
 * 		await csrf.validate(request);
 * 	} catch (error) {
 * 		if (error instanceof CSRFError) {
 * 			// handle CSRF errors
 * 		}
 * 		// handle other possible errors
 * 	}
 *
 * 	// here you know the request is valid
 * 	return redirectBack(request, { fallback: "/fallback" });
 * }
 * ```
 *
 * If you need to parse the body as FormData yourself (e.g. to support file uploads) you can also call `CSRF#validate` with the FormData and Headers objects.
 *
 * ```ts
 * let formData = await parseMultiPartFormData(request);
 * try {
 * 	await csrf.validate(formData, request.headers);
 * } catch (error) {
 * 	// handle errors
 * }
 * ```
 *
 * > [!WARNING]
 * > If you call `CSRF#validate` with the request instance, but you already read its body, it will throw an error.
 *
 * In case the CSRF validation fails, it will throw a `CSRFError` which can be used to correctly identify it against other possible errors that may get thrown.
 *
 * The list of possible error messages are:
 *
 * - `missing_token_in_cookie`: The request is missing the CSRF token in the cookie.
 * - `invalid_token_in_cookie`: The CSRF token is not valid (is not a string).
 * - `tampered_token_in_cookie`: The CSRF token doesn't match the signature.
 * - `missing_token_in_body`: The request is missing the CSRF token in the body (FormData).
 * - `mismatched_token`: The CSRF token in the cookie and the body don't match.
 *
 * You can use `error.code` to check one of the error codes above, and `error.message` to get a human friendly description.
 *
 * > [!WARNING]
 * > Don't send those error messages to the end-user, they are meant to be used for debugging purposes only.
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Server/CSRF
 */
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64url } from "@oslojs/encoding";
import type { Cookie } from "react-router";
import { randomString } from "../common/crypto.js";
import { getHeaders } from "./get-headers.js";

export type CSRFErrorCode =
	| "missing_token_in_cookie"
	| "invalid_token_in_cookie"
	| "tampered_token_in_cookie"
	| "missing_token_in_body"
	| "mismatched_token";

export class CSRFError extends Error {
	code: CSRFErrorCode;
	constructor(code: CSRFErrorCode, message: string) {
		super(message);
		this.code = code;
		this.name = "CSRFError";
	}
}

interface CSRFOptions {
	/**
	 * The cookie object to use for serializing and parsing the CSRF token.
	 */
	cookie: Cookie;
	/**
	 * The name of the form data key to use for the CSRF token.
	 */
	formDataKey?: string;
	/**
	 * A secret to use for signing the CSRF token.
	 */
	secret?: string;
}

export class CSRF {
	private cookie: Cookie;
	private formDataKey = "csrf";
	private secret?: string;

	constructor(options: CSRFOptions) {
		this.cookie = options.cookie;
		this.formDataKey = options.formDataKey ?? "csrf";
		this.secret = options.secret;
	}

	/**
	 * Generates a random string in Base64URL to be used as an authenticity token
	 * for CSRF protection.
	 * @param bytes The number of bytes used to generate the token
	 * @returns A random string in Base64URL
	 */
	generate(bytes = 32) {
		let token = randomString(bytes);
		if (!this.secret) return token;
		let signature = this.sign(token);
		return [token, signature].join(".");
	}

	/**
	 * Get the existing token from the cookie or generate a new one if it doesn't
	 * exist.
	 * @param requestOrHeaders A request or headers object from which we can
	 * get the cookie to get the existing token.
	 * @param bytes The number of bytes used to generate the token.
	 * @returns The existing token if it exists in the cookie, otherwise a new
	 * token.
	 */
	async getToken(requestOrHeaders: Request | Headers = new Headers(), bytes = 32) {
		let headers = getHeaders(requestOrHeaders);
		let existingToken = await this.cookie.parse(headers.get("cookie"));
		let token = typeof existingToken === "string" ? existingToken : this.generate(bytes);
		return token;
	}

	/**
	 * Generates a token and serialize it into the cookie.
	 * @param requestOrHeaders A request or headers object from which we can
	 * get the cookie to get the existing token.
	 * @param bytes The number of bytes used to generate the token
	 * @returns A tuple with the token and the string to send in Set-Cookie
	 * If there's already a csrf value in the cookie then the token will
	 * be the same and the cookie will be null.
	 * @example
	 * let [token, cookie] = await csrf.commitToken(request);
	 * return json({ token }, {
	 *   headers: { "set-cookie": cookie }
	 * })
	 */
	async commitToken(requestOrHeaders: Request | Headers = new Headers(), bytes = 32) {
		let headers = getHeaders(requestOrHeaders);
		let existingToken = await this.cookie.parse(headers.get("cookie"));
		let token = typeof existingToken === "string" ? existingToken : this.generate(bytes);
		let cookie = existingToken ? null : await this.cookie.serialize(token);
		return [token, cookie] as const;
	}

	/**
	 * Verify if a request and cookie has a valid CSRF token.
	 * @example
	 * export async function action({ request }: Route.ActionArgs) {
	 *   await csrf.validate(request);
	 *   // the request is authenticated and you can do anything here
	 * }
	 * @example
	 * export async function action({ request }: Route.ActionArgs) {
	 *   let formData = await request.formData()
	 *   await csrf.validate(formData, request.headers);
	 *   // the request is authenticated and you can do anything here
	 * }
	 * @example
	 * export async function action({ request }: Route.ActionArgs) {
	 *   let formData = await parseMultipartFormData(request);
	 *   await csrf.validate(formData, request.headers);
	 *   // the request is authenticated and you can do anything here
	 * }
	 */
	validate(data: Request): Promise<void>;
	validate(data: FormData, headers: Headers): Promise<void>;
	async validate(data: FormData | Request, headers?: Headers): Promise<void> {
		if (data instanceof Request && data.bodyUsed) {
			throw new Error(
				"The body of the request was read before calling CSRF#verify. Ensure you clone it before reading it.",
			);
		}

		let formData = await this.readBody(data);

		let cookie = await this.parseCookie(data, headers);

		// if the session doesn't have a csrf token, throw an error
		if (cookie === null) {
			throw new CSRFError("missing_token_in_cookie", "Can't find CSRF token in cookie.");
		}

		if (typeof cookie !== "string") {
			throw new CSRFError("invalid_token_in_cookie", "Invalid CSRF token in cookie.");
		}

		if (this.verifySignature(cookie) === false) {
			throw new CSRFError("tampered_token_in_cookie", "Tampered CSRF token in cookie.");
		}

		// if the body doesn't have a csrf token, throw an error
		if (!formData.get(this.formDataKey)) {
			throw new CSRFError("missing_token_in_body", "Can't find CSRF token in body.");
		}

		// if the body csrf token doesn't match the session csrf token, throw an
		// error
		if (formData.get(this.formDataKey) !== cookie) {
			throw new CSRFError("mismatched_token", "Can't verify CSRF token authenticity.");
		}
	}

	private async readBody(data: FormData | Request) {
		if (data instanceof FormData) return data;
		return await data.clone().formData();
	}

	private parseCookie(data: FormData | Request, headers?: Headers) {
		let _headers = data instanceof Request ? data.headers : headers;
		if (!_headers) return null;
		return this.cookie.parse(_headers.get("cookie"));
	}

	private sign(token: string) {
		if (!this.secret) return token;
		return encodeBase64url(sha256(new TextEncoder().encode(token)));
	}

	private verifySignature(token: string) {
		if (!this.secret) return true;
		let [value, signature] = token.split(".");
		if (!value) return false;
		let expectedSignature = this.sign(value);
		return signature === expectedSignature;
	}
}
