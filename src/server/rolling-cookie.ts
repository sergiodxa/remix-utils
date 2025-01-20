import type { Cookie } from "react-router";
import { z } from "zod";
import type { TypedCookie } from "./typed-cookie.js";

export async function rollingCookie<Schema extends z.ZodTypeAny>(
	cookie: Cookie | TypedCookie<Schema>,
	request: Request,
	responseHeaders: Headers,
) {
	let value = await cookie.parse(responseHeaders.get("Set-Cookie"));
	if (value !== null) return;
	value = await cookie.parse(request.headers.get("Cookie"));
	if (!value) return;
	responseHeaders.append("Set-Cookie", await cookie.serialize(value));
}
