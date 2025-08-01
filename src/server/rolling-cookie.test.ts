import { describe, expect, test } from "bun:test";
import { createCookie } from "react-router";
import { z } from "zod/v4";
import { rollingCookie } from "./rolling-cookie";
import { ValidationError, createTypedCookie } from "./typed-cookie";

describe(rollingCookie, () => {
	describe("Remix Cookie", () => {
		let cookie = createCookie("name", { secrets: ["secret"] });

		test("should do nothing if request and headers don't have the cookie", async () => {
			let headers = new Headers();
			let request = new Request("http://remix.utils");

			await rollingCookie(cookie, request, headers);

			expect(headers.has("set-cookie")).toBe(false);
			expect(headers.get("Set-Cookie")).toMatchSnapshot("null");
		});

		test("should roll the cookie if the headers didn't set it", async () => {
			let headers = new Headers();
			let request = new Request("http://remix.utils", {
				headers: { Cookie: await cookie.serialize("value from request") },
			});

			await rollingCookie(cookie, request, headers);

			expect(headers.has("set-cookie")).toBe(true);
			expect(headers.get("Set-Cookie")).toMatchSnapshot(
				'"name=InZhbHVlIGZyb20gcmVxdWVzdCI%3D.aAWOIClnDL9RHt889ih6hgFjmuEkKI3hAbB1sMFrga4; Path=/; SameSite=Lax"',
			);
		});

		test("should do nothing i the headers came with set-cookie for this cookie", async () => {
			let headers = new Headers({
				"Set-Cookie": await cookie.serialize("value from headers"),
			});
			let request = new Request("http://remix.utils", {
				headers: { Cookie: await cookie.serialize("value from request") },
			});

			await rollingCookie(cookie, request, headers);

			expect(headers.has("set-cookie")).toBe(true);
			expect(headers.get("Set-Cookie")).toMatchSnapshot(
				'"name=InZhbHVlIGZyb20gaGVhZGVycyI%3D.bLpX1ehfp7NZe7E9yNSkd56WbnG3QdHLmfwxt%2BxfkfA; Path=/; SameSite=Lax"',
			);
		});

		test("should roll the cookie if the headers set another different cookie", async () => {
			let otherCookie = createCookie("other", { secrets: ["secret"] });
			let headers = new Headers({
				"Set-Cookie": await otherCookie.serialize("value from other cookie"),
			});
			let request = new Request("http://remix.utils", {
				headers: { Cookie: await cookie.serialize("value from request") },
			});

			expect(headers.has("set-cookie")).toBe(true);

			await rollingCookie(cookie, request, headers);

			expect(headers.has("set-cookie")).toBe(true);
			expect(headers.get("Set-Cookie")).toMatchSnapshot(
				'"other=InZhbHVlIGZyb20gb3RoZXIgY29va2llIg%3D%3D.wn3PvV5dGwPg2Ql8wMy1Q%2B0v%2BU0UQjrI7SBgR6W51QQ; Path=/; SameSite=Lax, name=InZhbHVlIGZyb20gcmVxdWVzdCI%3D.aAWOIClnDL9RHt889ih6hgFjmuEkKI3hAbB1sMFrga4; Path=/; SameSite=Lax"',
			);
		});
	});

	describe("Typed Cookie", () => {
		let cookie = createCookie("name", { secrets: ["secret"] });
		let typedCookie = createTypedCookie({
			cookie,
			schema: z.string().min(3),
		});

		test("should do nothing if request and headers don't have the cookie", async () => {
			let headers = new Headers();
			let request = new Request("http://remix.utils");

			await rollingCookie(typedCookie, request, headers);

			expect(headers.has("set-cookie")).toBe(false);
			expect(headers.get("Set-Cookie")).toMatchSnapshot("null");
		});

		test("should roll the cookie if the headers didn't set it", async () => {
			let headers = new Headers();
			let request = new Request("http://remix.utils", {
				headers: { Cookie: await typedCookie.serialize("value from request") },
			});

			await rollingCookie(typedCookie, request, headers);

			expect(headers.has("set-cookie")).toBe(true);
			expect(headers.get("Set-Cookie")).toMatchSnapshot(
				'"name=InZhbHVlIGZyb20gcmVxdWVzdCI%3D.aAWOIClnDL9RHt889ih6hgFjmuEkKI3hAbB1sMFrga4; Path=/; SameSite=Lax"',
			);
		});

		test("should do nothing i the headers came with set-cookie for this cookie", async () => {
			let headers = new Headers({
				"Set-Cookie": await typedCookie.serialize("value from headers"),
			});

			let request = new Request("http://remix.utils", {
				headers: { Cookie: await typedCookie.serialize("value from request") },
			});

			await rollingCookie(typedCookie, request, headers);

			expect(headers.has("set-cookie")).toBe(true);
			expect(headers.get("Set-Cookie")).toMatchSnapshot(
				'"name=InZhbHVlIGZyb20gaGVhZGVycyI%3D.bLpX1ehfp7NZe7E9yNSkd56WbnG3QdHLmfwxt%2BxfkfA; Path=/; SameSite=Lax"',
			);
		});

		test("should roll the cookie if the headers set another different cookie", async () => {
			let otherCookie = createCookie("other", { secrets: ["secret"] });

			let responseHeaders = new Headers({
				"Set-Cookie": await otherCookie.serialize("value from other cookie"),
			});

			let request = new Request("http://remix.utils", {
				headers: { Cookie: await typedCookie.serialize("value from request") },
			});

			expect(responseHeaders.has("set-cookie")).toBe(true);

			await rollingCookie(typedCookie, request, responseHeaders);

			expect(responseHeaders.has("set-cookie")).toBe(true);
			expect(responseHeaders.get("Set-Cookie")).toMatchSnapshot(
				'"other=InZhbHVlIGZyb20gb3RoZXIgY29va2llIg%3D%3D.wn3PvV5dGwPg2Ql8wMy1Q%2B0v%2BU0UQjrI7SBgR6W51QQ; Path=/; SameSite=Lax, name=InZhbHVlIGZyb20gcmVxdWVzdCI%3D.aAWOIClnDL9RHt889ih6hgFjmuEkKI3hAbB1sMFrga4; Path=/; SameSite=Lax"',
			);
		});
	});
});
