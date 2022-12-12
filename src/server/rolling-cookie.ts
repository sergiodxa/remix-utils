import type { Cookie } from "@remix-run/server-runtime";
import { z } from "zod";
import { TypedCookie } from "./typed-cookie";

export async function rollingCookie<Schema extends z.ZodTypeAny>(
  cookie: Cookie | TypedCookie<Schema>,
  request: Request,
  responseHeaders: Headers
) {
  let value = await cookie.parse(responseHeaders.get("Set-Cookie"));
  if (value !== null) return;
  value = await cookie.parse(request.headers.get("Cookie"));
  if (!value) return;
  responseHeaders.append("Set-Cookie", await cookie.serialize(value));
}
