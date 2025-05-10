import { describe, expect, test } from "bun:test";
import { createCookie } from "react-router";
import { unstable_createRollingCookieMiddleware } from "./rolling-cookie";
import { runMiddleware } from "./test-helper";

const cookie = createCookie("name", { maxAge: 60 * 60 * 24 });

describe(unstable_createRollingCookieMiddleware, () => {
	test("if the request has no cookie the middleware does nothing", async () => {
		let [middleware] = unstable_createRollingCookieMiddleware({ cookie });
		let response = await runMiddleware(middleware);
		expect(response.headers.getAll("set-cookie")).toEqual([]);
	});

	test("if the request has a cookie, the middleware rolls it", async () => {
		let [middleware] = unstable_createRollingCookieMiddleware({ cookie });

		let request = new Request("https://remix.utils", {
			headers: { Cookie: await cookie.serialize("value from request") },
		});

		let response = await runMiddleware(middleware, { request });

		expect(response.headers.get("set-cookie")).toBe(
			await cookie.serialize("value from request"),
		);
	});

	test("if the response already sets the cookie, the middleware does nothing", async () => {
		let [middleware] = unstable_createRollingCookieMiddleware({ cookie });

		let request = new Request("https://remix.utils", {
			headers: { Cookie: await cookie.serialize("value from request") },
		});

		let response = await runMiddleware(middleware, {
			request,
			async next() {
				return new Response(null, {
					headers: {
						"set-cookie": await cookie.serialize("value from response"),
					},
				});
			},
		});

		expect(response.headers.get("set-cookie")).toBe(
			await cookie.serialize("value from response"),
		);
	});
});
