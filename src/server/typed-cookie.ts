import {
  Cookie,
  CookieParseOptions,
  CookieSerializeOptions,
} from "@remix-run/server-runtime";
import type { z } from "zod";

export interface TypedCookie<Schema extends z.ZodTypeAny> extends Cookie {
  isTyped: true;
  parse(
    cookieHeader: string,
    options?: CookieParseOptions
  ): Promise<z.infer<Schema> | null>;

  serialize(
    value: z.infer<Schema>,
    options?: CookieSerializeOptions
  ): Promise<string>;
}

export function createTypedCookie<Schema extends z.ZodTypeAny>({
  cookie,
  schema,
}: {
  cookie: Cookie;
  schema: Schema;
}): TypedCookie<Schema> {
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
      return await schema.parseAsync(value);
    },
    async serialize(value, options) {
      let parsedValue = await schema.parseAsync(value);
      return cookie.serialize(parsedValue, options);
    },
  };
}
