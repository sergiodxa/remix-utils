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
	return (
		isCookie(value) &&
		(value as unknown as { isTyped: boolean }).isTyped === true
	);
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
