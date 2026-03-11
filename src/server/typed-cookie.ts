/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/typed-cookie`.
 *
 * > [!NOTE]
 * > This depends on `@standard-schema/spec`, and React Router.
 *
 * Cookie objects in Remix allows any type, the typed cookies from Remix Utils lets you use any Standard Schema compatible library to parse the cookie values and ensure they conform to a schema.
 *
 * ```ts
 * import { createCookie } from "react-router";
 * import { createTypedCookie } from "remix-utils/typed-cookie";
 * import { z } from "zod"; //or another Standard Schema compatible library
 *
 * let cookie = createCookie("returnTo", cookieOptions);
 * // I recommend you to always add `nullable` to your schema, if a cookie didn't
 * // come with the request Cookie header Remix will return null, and it can be
 * // useful to remove it later when clearing the cookie
 * let schema = z.string().url().nullable();
 *
 * // pass the cookie and the schema
 * let typedCookie = createTypedCookie({ cookie, schema });
 *
 * // this will be a string and also a URL
 * let returnTo = await typedCookie.parse(request.headers.get("Cookie"));
 *
 * // this will not pass the schema validation and throw a ZodError
 * await typedCookie.serialize("a random string that's not a URL");
 * // this will make TS yell because it's not a string, if you ignore it it will
 * // throw a ZodError
 * await typedCookie.serialize(123);
 * ```
 *
 * You could also use typed cookies with any sessionStorage mechanism from Remix.
 *
 * ```ts
 * let cookie = createCookie("session", cookieOptions);
 * let schema = z.object({ token: z.string().nullish() }).nullable();
 *
 * let sessionStorage = createCookieSessionStorage({
 * 	cookie: createTypedCookie({ cookie, schema }),
 * });
 *
 * // if this works then the correct data is stored in the session
 * let session = sessionStorage.getSession(request.headers.get("Cookie"));
 *
 * session.unset("token"); // remove a required key from the session
 *
 * // this will throw a ZodError because the session is missing the required key
 * await sessionStorage.commitSession(session);
 * ```
 *
 * Now Zod will ensure the data you try to save to the session is valid removing any extra field and throwing if you don't set the correct data in the session.
 *
 * > [!IMPORTANT]
 * > The session object is not really typed so doing session.get will not return the correct type, you can do `schema.parse(session.data)` to get the typed version of the session data.
 *
 * You can also use async refinements in your schemas because typed cookies uses parseAsync method from Zod.
 *
 * ```ts
 * let cookie = createCookie("session", cookieOptions);
 *
 * let schema = z
 * 	.object({
 * 		token: z.string().refine(async (token) => {
 * 			let user = await getUserByToken(token);
 * 			return user !== null;
 * 		}, "INVALID_TOKEN"),
 * 	})
 * 	.nullable();
 *
 * let sessionTypedCookie = createTypedCookie({ cookie, schema });
 *
 * // this will throw if the token stored in the cookie is not valid anymore
 * sessionTypedCookie.parse(request.headers.get("Cookie"));
 * ```
 *
 * Finally, to be able to delete a cookie, you can add `.nullable()` to your schema and serialize it with `null` as value.
 *
 * ```ts
 * // Set the value as null and expires as current date - 1 second so the browser expires the cookie
 * await typedCookie.serialize(null, { expires: new Date(Date.now() - 1) });
 * ```
 *
 * If you didn't add `.nullable()` to your schema, you will need to provide a mock value and set the expires date to the past.
 *
 * ```ts
 * let cookie = createCookie("returnTo", cookieOptions);
 * let schema = z.string().url().nullable();
 *
 * let typedCookie = createTypedCookie({ cookie, schema });
 *
 * await typedCookie.serialize("some fake url to pass schema validation", {
 * 	expires: new Date(Date.now() - 1),
 * });
 * ```
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Server/Typed Cookie
 */
import type { StandardSchemaV1 } from "@standard-schema/spec";
import {
	type Cookie,
	type CookieParseOptions,
	type CookieSerializeOptions,
	isCookie,
} from "react-router";

export interface TypedCookie<Schema extends StandardSchemaV1> extends Cookie {
	isTyped: true;

	parse(
		cookieHeader: string | null,
		options?: CookieParseOptions,
	): Promise<StandardSchemaV1.InferOutput<Schema> | null>;

	serialize(
		value: StandardSchemaV1.InferInput<Schema>,
		options?: CookieSerializeOptions,
	): Promise<string>;
}

export function createTypedCookie<Schema extends StandardSchemaV1>({
	cookie,
	schema,
}: {
	cookie: Cookie;
	schema: Schema;
}): TypedCookie<Schema> {
	return {
		isTyped: true as const,
		get name() {
			return cookie.name;
		},
		get isSigned() {
			return cookie.isSigned;
		},
		get expires() {
			return cookie.expires;
		},
		async parse(cookieHeader, options) {
			if (!cookieHeader) return null;
			let value = await cookie.parse(cookieHeader, options);
			if (value === null) return null;
			let result = await schema["~standard"].validate(value);
			if (result.issues) throw new ValidationError(result.issues);
			return result.value;
		},
		async serialize(value, options) {
			let result = await schema["~standard"].validate(value);
			if (result.issues) throw new ValidationError(result.issues);
			return cookie.serialize(result.value, options);
		},
	};
}

/**
 * Returns true if an object is a Remix Utils Typed Cookie container.
 *
 * @see https://github.com/sergiodxa/remix-utils#typed-cookies
 */
export function isTypedCookie<Schema extends StandardSchemaV1>(
	value: unknown,
): value is TypedCookie<Schema> {
	return isCookie(value) && (value as unknown as { isTyped: boolean }).isTyped === true;
}

function _flash<Key extends string>(name: Key): `__flash_${Key}__` {
	return `__flash_${name}__`;
}

async function _parseSchemaWithFlashKeys<Schema extends StandardSchemaV1>(
	schema: Schema,
	value: StandardSchemaV1.InferInput<Schema>,
): Promise<StandardSchemaV1.InferOutput<Schema> | null> {
	let result = await schema["~standard"].validate(value);
	if (result.issues) throw new ValidationError(result.issues);
	return result.value;
}

export class ValidationError extends Error {
	override name = "ValidationError";
	constructor(public readonly issues: Readonly<StandardSchemaV1.Issue[]>) {
		super("Validation error");
		this.name = "ValidationError";
	}
}

function _isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
