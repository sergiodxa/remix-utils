import {
	type CookieParseOptions,
	type CookieSerializeOptions,
	type Session,
	type SessionStorage,
	isSession,
} from "react-router";
import { z } from "zod";

export interface TypedSession<Schema extends z.ZodTypeAny> {
	/**
	 * Marks a session as a typed session.
	 */
	readonly isTyped: boolean;

	/**
	 * A unique identifier for this session.
	 *
	 * Note: This will be the empty string for newly created sessions and
	 * sessions that are not backed by a database (i.e. cookie-based sessions).
	 */
	readonly id: string;
	/**
	 * The raw data contained in this session.
	 *
	 * This is useful mostly for SessionStorage internally to access the raw
	 * session data to persist.
	 */
	readonly data: z.infer<Schema>;
	/**
	 * Returns `true` if the session has a value for the given `name`, `false`
	 * otherwise.
	 */
	has<Key extends keyof z.infer<Schema>>(name: Key): boolean;
	/**
	 * Returns the value for the given `name` in this session.
	 */
	get<Key extends keyof z.infer<Schema>>(key: Key): z.infer<Schema>[Key] | null;
	/**
	 * Sets a value in the session for the given `name`.
	 */
	set<Key extends keyof z.infer<Schema>>(
		name: Key,
		value: z.infer<Schema>[Key],
	): void;
	/**
	 * Sets a value in the session that is only valid until the next `get()`.
	 * This can be useful for temporary values, like error messages.
	 */
	flash<Key extends keyof z.infer<Schema>>(
		name: Key,
		value: z.infer<Schema>[Key],
	): void;
	/**
	 * Removes a value from the session.
	 */
	unset<Key extends keyof z.infer<Schema>>(name: Key): void;
}

export interface TypedSessionStorage<Schema extends z.ZodTypeAny> {
	getSession(
		cookieHeader?: string | null | undefined,
		options?: CookieParseOptions | undefined,
	): Promise<TypedSession<Schema>>;

	commitSession(
		session: TypedSession<Schema>,
		options?: CookieSerializeOptions | undefined,
	): Promise<string>;

	destroySession(
		session: TypedSession<Schema>,
		options?: CookieSerializeOptions | undefined,
	): Promise<string>;
}

/**
 * @deprecated The createSessionStorage utils from React Router already supports typed sessions using a generic
 */
export function createTypedSessionStorage<Schema extends z.AnyZodObject>({
	sessionStorage,
	schema,
}: {
	sessionStorage: SessionStorage;
	schema: Schema;
}): TypedSessionStorage<Schema> {
	return {
		async getSession(cookieHeader, options?) {
			let session = await sessionStorage.getSession(cookieHeader, options);
			return await createTypedSession({ session, schema });
		},
		async commitSession(session, options?) {
			// check if session.data is valid
			await schema.parseAsync(session.data);
			return await sessionStorage.commitSession(session as Session, options);
		},
		async destroySession(session) {
			// check if session.data is valid
			await schema.parseAsync(session.data);
			return await sessionStorage.destroySession(session as Session);
		},
	};
}

async function createTypedSession<Schema extends z.AnyZodObject>({
	session,
	schema,
}: {
	session: Session;
	schema: Schema;
}): Promise<TypedSession<Schema>> {
	// get a raw shape version of the schema but converting all the keys to their
	// flash versions.
	let flashSchema: z.ZodRawShape = {};
	for (let key in schema.shape) {
		flashSchema[flash(key)] = schema.shape[key].optional();
	}

	// parse session.data to add default values and remove invalid ones
	// we use strict mode here so we can throw an error if the session data
	// contains any invalid key, which is a sign that the session data is
	// corrupted.
	let data = await schema.extend(flashSchema).strict().parseAsync(session.data);

	return {
		get isTyped() {
			return true;
		},
		get id() {
			return session.id;
		},
		get data() {
			return data;
		},
		has(name) {
			let key = String(safeKey(schema, name));
			return key in data || flash(key) in data;
		},
		get(name) {
			let key = String(safeKey(schema, name));
			if (key in data) return data[key];
			let flashKey = flash(key);
			if (flashKey in data) {
				let value = data[flashKey];
				delete data[flashKey];
				return value;
			}
			return;
		},
		set(name, value) {
			let key = String(safeKey(schema, name));
			data[key] = value;
		},
		flash(name, value) {
			let key = String(safeKey(schema, name));
			let flashKey = flash(key);
			data[flashKey] = value;
		},
		unset(name) {
			let key = String(safeKey(schema, name));
			delete data[key];
		},
	};
}

/**
 * ReReturns true if an object is a Remix Utils typed session.
 *
 * @see https://github.com/sergiodxa/remix-utils#typed-session
 */
export function isTypedSession<Schema extends z.AnyZodObject>(
	value: unknown,
): value is TypedSession<Schema> {
	return (
		isSession(value) &&
		(value as unknown as { isTyped: boolean }).isTyped === true
	);
}

function flash<Key extends string>(name: Key): `__flash_${Key}__` {
	return `__flash_${name}__`;
}

// checks that the key is a valid key of the schema
function safeKey<Schema extends z.AnyZodObject>(
	schema: Schema,
	key: keyof z.infer<Schema>,
) {
	return schema.keyof().parse(key);
}
