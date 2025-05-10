import { describe, expect, test } from "bun:test";

import {
	createCookie,
	createMemorySessionStorage,
	isSession,
	redirect,
	redirectDocument,
	unstable_RouterContextProvider,
} from "react-router";
import { unstable_createSessionMiddleware } from "./session";
import { runMiddleware } from "./test-helper";

describe(unstable_createSessionMiddleware, () => {
	let cookie = createCookie("session", { secrets: ["test"] });
	let sessionStorage = createMemorySessionStorage({ cookie });

	test("the middleware sets the Session instance in the context and can be retrieved", async () => {
		let [middleware, getSession] =
			unstable_createSessionMiddleware(sessionStorage);

		let context = new unstable_RouterContextProvider();

		await runMiddleware(middleware, { context });

		let session = getSession(context);

		expect(session).toBeObject();
		expect(isSession(session)).toBeTrue();
	});

	test("the middleware commits the session if the data has changed", async () => {
		let [middleware, getSession] =
			unstable_createSessionMiddleware(sessionStorage);

		let context = new unstable_RouterContextProvider();

		let response = await runMiddleware(middleware, {
			context,
			next() {
				let session = getSession(context);
				session.set("key", "value");
				return new Response(null);
			},
		});

		expect(response.headers.get("Set-Cookie")).toBeString();
	});

	test("the middleware doesn't commits the session if the shouldCommit function returns false", async () => {
		let [middleware, getSession] = unstable_createSessionMiddleware(
			sessionStorage,
			() => false,
		);

		let context = new unstable_RouterContextProvider();

		let response = await runMiddleware(middleware, {
			context,
			next() {
				let session = getSession(context);
				session.set("key", "value");
				return new Response(null);
			},
		});

		expect(response.headers.get("Set-Cookie")).toBeNull();
	});

	test("the middleware only commits the session if the shouldCommit function returns true", async () => {
		let [middleware, getSession] = unstable_createSessionMiddleware(
			sessionStorage,
			(prev, next) => prev.key !== next.key,
		);

		let context = new unstable_RouterContextProvider();

		let response = await runMiddleware(middleware, {
			context,
			next() {
				let session = getSession(context);
				session.set("key", "value");
				return new Response(null);
			},
		});

		expect(response.headers.get("Set-Cookie")).toBeString();

		response = await runMiddleware(middleware, { context });

		expect(response.headers.get("Set-Cookie")).toBeNull();
	});

	test("a returned redirect has the session set", async () => {
		let [middleware, getSession] =
			unstable_createSessionMiddleware(sessionStorage);

		let context = new unstable_RouterContextProvider();

		let response = await runMiddleware(middleware, {
			context,
			next() {
				let session = getSession(context);
				session.set("key", "value");
				return redirect("/test");
			},
		});

		let session = await sessionStorage.getSession(
			response.headers.get("set-cookie"),
		);

		expect(session.get("key")).toEqual("value");
	});

	test("a returned redirectDocument has the session set", async () => {
		let [middleware, getSession] =
			unstable_createSessionMiddleware(sessionStorage);

		let context = new unstable_RouterContextProvider();

		let response = await runMiddleware(middleware, {
			context,
			next() {
				let session = getSession(context);
				session.set("key", "value");
				return redirectDocument("/test");
			},
		});

		let session = await sessionStorage.getSession(
			response.headers.get("set-cookie"),
		);

		expect(session.get("key")).toEqual("value");
	});

	test.failing("a thrown redirect has the session set", async () => {
		let [middleware, getSession] =
			unstable_createSessionMiddleware(sessionStorage);

		let context = new unstable_RouterContextProvider();

		let response = await runMiddleware(middleware, {
			context,
			next() {
				let session = getSession(context);
				session.set("key", "value");
				throw redirect("/test");
			},
		});

		let session = await sessionStorage.getSession(
			response.headers.get("set-cookie"),
		);

		expect(session.get("key")).toEqual("value");
	});

	test.failing("a thrown redirectDocument has the session set", async () => {
		let [middleware, getSession] =
			unstable_createSessionMiddleware(sessionStorage);

		let context = new unstable_RouterContextProvider();

		let response = await runMiddleware(middleware, {
			context,
			next() {
				let session = getSession(context);
				session.set("key", "value");
				throw redirectDocument("/test");
			},
		});

		let session = await sessionStorage.getSession(
			response.headers.get("set-cookie"),
		);

		expect(session.get("key")).toEqual("value");
	});
});
