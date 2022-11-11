import {
  CookieParseOptions,
  CookieSerializeOptions,
  isSession,
  Session,
  SessionStorage,
} from "@remix-run/server-runtime";
import type { z } from "zod";

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
  get<Key extends keyof z.infer<Schema>>(
    key: Key
  ): z.infer<Schema>[Key] | null;
  /**
   * Sets a value in the session for the given `name`.
   */
  set<Key extends keyof z.infer<Schema>>(
    name: Key,
    value: z.infer<Schema>[Key]
  ): void;
  /**
   * Sets a value in the session that is only valid until the next `get()`.
   * This can be useful for temporary values, like error messages.
   */
  flash<Key extends keyof z.infer<Schema>>(
    name: Key,
    value: z.infer<Schema>[Key]
  ): void;
  /**
   * Removes a value from the session.
   */
  unset<Key extends keyof z.infer<Schema>>(name: Key): void;
}

export interface TypedSessionStorage<Schema extends z.ZodTypeAny> {
  getSession(
    cookieHeader?: string | null | undefined,
    options?: CookieParseOptions | undefined
  ): Promise<TypedSession<Schema>>;

  commitSession(
    session: TypedSession<Schema>,
    options?: CookieSerializeOptions | undefined
  ): Promise<string>;

  destroySession(
    session: TypedSession<Schema>,
    options?: CookieSerializeOptions | undefined
  ): Promise<string>;
}

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
      await schema.parseAsync(session.data); // check if session.data is valid
      return await sessionStorage.commitSession(session as Session, options);
    },
    async destroySession(session) {
      await schema.parseAsync(session.data); // check if session.data is valid
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
  // parse data so session.data is typed
  let data = await schema.parseAsync(session.data);

  // remove keys from session that are not valid and re-set others
  for (let key in session.data) {
    if (data[key] === undefined) session.unset(key);
    else if (data[key] !== session.data[key]) session.set(key, data[key]);
    else continue;
  }

  // add any default keys that don't exist in the internal session
  for (let key in data) session.set(key, data[key]);

  // Checks the the key is a valid key of the schema
  function safeKey(key: keyof z.infer<Schema>) {
    return schema.keyof().parse(key);
  }

  function safeValue<Key extends keyof z.infer<Schema>>(
    key: Key,
    value: z.infer<Schema>[Key]
  ) {
    return schema.shape[key].parse(value);
  }

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
      return session.has(String(safeKey(name)));
    },
    get(name) {
      let value = session.get(String(safeKey(name)));
      return safeValue(safeKey(name), value);
    },
    set(name, value) {
      data[safeKey(name)] = safeValue(safeKey(name), value);
      session.set(String(safeKey(name)), data[safeKey(name)]);
    },
    flash(name, value) {
      data[safeKey(name)] = safeValue(safeKey(name), value);
      session.flash(String(safeKey(name)), data[safeKey(name)]);
    },
    unset(name) {
      session.unset(String(safeKey(name)));
    },
  };
}

/**
 * ReReturns true if an object is a Remix Utils typed session.
 *
 * @see https://github.com/sergiodxa/remix-utils#typed-session
 */
export function isTypedSession<Schema extends z.AnyZodObject>(
  value: unknown
): value is TypedSession<Schema> {
  return (
    isSession(value) &&
    (value as unknown as { isTyped: boolean }).isTyped === true
  );
}
