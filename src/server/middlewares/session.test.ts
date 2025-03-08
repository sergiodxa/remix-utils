import { describe, expect, mock, test } from "bun:test";

import {
	createMemorySessionStorage,
	isSession,
	unstable_RouterContextProvider,
} from "react-router";
import { unstable_createSessionMiddleware } from "./session";

describe(unstable_createSessionMiddleware.name, () => {
	let sessionStorage = createMemorySessionStorage({
		cookie: { name: "session", secrets: ["test"] },
	});

	test("returns an array with two functions", () => {
		let result = unstable_createSessionMiddleware(sessionStorage);
		expect(result).toBeArray();
		expect(result).toHaveLength(2);
		expect(result[0]).toBeFunction();
		expect(result[1]).toBeFunction();
	});

	test("the middleware sets the Session instance in the context and can be retrieved", async () => {
		let [middleware, getSession] =
			unstable_createSessionMiddleware(sessionStorage);

		let context = new unstable_RouterContextProvider();
		let request = new Request("https://remix.utils");
		let next = mock().mockImplementation((res = new Response(null)) => res);

		await middleware({ request, context, params: {} }, next);

		let session = getSession(context);

		expect(session).toBeObject();
		expect(isSession(session)).toBeTrue();
	});

	test("the middleware commits the session if the data has changed", async () => {
		let [middleware, getSession] =
			unstable_createSessionMiddleware(sessionStorage);

		let context = new unstable_RouterContextProvider();
		let request = new Request("https://remix.utils");
		let next = mock().mockImplementation(() => {
			let session = getSession(context);
			session.set("key", "value");
			return new Response(null);
		});

		let response = await middleware({ request, context, params: {} }, next);

		expect(response.headers.get("Set-Cookie")).toBeString();
	});

	test("the middleware doesn't commits the session if the shouldCommit function returns false", async () => {
		let [middleware, getSession] = unstable_createSessionMiddleware(
			sessionStorage,
			() => false,
		);

		let context = new unstable_RouterContextProvider();
		let request = new Request("https://remix.utils");
		let next = mock().mockImplementation(() => {
			let session = getSession(context);
			session.set("key", "value");
			return new Response(null);
		});

		let response = await middleware({ request, context, params: {} }, next);

		expect(response.headers.get("Set-Cookie")).toBeNull();
	});

	test("the middleware only commits the session if the shouldCommit function returns true", async () => {
		let [middleware, getSession] = unstable_createSessionMiddleware(
			sessionStorage,
			(prev, next) => prev.key !== next.key,
		);

		let context = new unstable_RouterContextProvider();
		let request = new Request("https://remix.utils");

		let response = await middleware(
			{ request, context, params: {} },
			mock().mockImplementation(() => {
				let session = getSession(context);
				session.set("key", "value");
				return new Response(null);
			}),
		);

		expect(response.headers.get("Set-Cookie")).toBeString();

		response = await middleware(
			{ request, context, params: {} },
			mock().mockImplementation(() => {
				return new Response(null);
			}),
		);

		expect(response.headers.get("Set-Cookie")).toBeNull();
	});
});
