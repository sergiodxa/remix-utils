import {
	Cookie,
	CookieParseOptions,
	CookieSerializeOptions,
	isCookie,
} from "@remix-run/server-runtime";
import type { z } from "zod";

export interface TypedCookie<Schema extends z.ZodTypeAny> extends Cookie {
	isTyped: true;

	parse(
		cookieHeader: string | null,
		options?: CookieParseOptions,
	): Promise<z.infer<Schema> | null>;

	serialize(
		value: z.infer<Schema>,
		options?: CookieSerializeOptions,
	): Promise<string>;
}

export function createTypedCookie<Schema extends z.ZodTypeAny>({
	cookie,
	schema,
}: {
	cookie: Cookie;
	schema: Schema;
}): TypedCookie<Schema> {
	if (schema._def.typeName === "ZodObject") {
		let flashSchema: z.ZodRawShape = {};
		for (let key in (schema as unknown as z.AnyZodObject).shape) {
			flashSchema[flash(key)] = (schema as unknown as z.AnyZodObject).shape[
				key
			].optional();
		}
	}

	return {
		isTyped: true,
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
			return await parseSchemaWithFlashKeys(schema, value);
		},
		async serialize(value, options) {
			let parsedValue = await parseSchemaWithFlashKeys(schema, value);
			return cookie.serialize(parsedValue, options);
		},
	};
}

/**
 * Returns true if an object is a Remix Utils Typed Cookie container.
 *
 * @see https://github.com/sergiodxa/remix-utils#typed-cookies
 */
export function isTypedCookie<Schema extends z.ZodTypeAny>(
	value: unknown,
): value is TypedCookie<Schema> {
	return (
		isCookie(value) &&
		(value as unknown as { isTyped: boolean }).isTyped === true
	);
}

function flash<Key extends string>(name: Key): `__flash_${Key}__` {
	return `__flash_${name}__`;
}

function parseSchemaWithFlashKeys<Schema extends z.ZodTypeAny>(
	schema: Schema,
	value: z.infer<Schema>,
): Promise<z.infer<Schema>> {
	// if the Schema is not a ZodObject, we use it directly
	if (schema._def.typeName !== "ZodObject") {
		return schema.nullable().parseAsync(value);
	}

	// but if it's a ZodObject, we need to add support for flash keys, so we
	// get the shape of the schema, create a flash key for each key, and then we
	// extend the original schema with the flash schema and parse the value
	let objectSchema = schema as unknown as z.AnyZodObject;
	let flashSchema: z.ZodRawShape = {};
	for (let key in objectSchema.shape) {
		flashSchema[flash(key)] = objectSchema.shape[key].optional();
	}
	return objectSchema.extend(flashSchema).parseAsync(value);
}
