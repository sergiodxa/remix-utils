import { describe, expect, test } from "bun:test";
import { RouterContextProvider } from "react-router";
import { createRequestIDMiddleware } from "./request-id.js";
import { runMiddleware } from "./test-helper.js";

describe(createRequestIDMiddleware, () => {
	test("gets the request id from the X-Request-ID header", async () => {
		let [middleware, getRequestID] = createRequestIDMiddleware();

		let request = new Request("https://remix.run", {
			headers: {
				"X-Request-ID": "test-request-id",
			},
		});
		let context = new RouterContextProvider();

		await runMiddleware(middleware, { request, context });

		let requestId = getRequestID(context);

		expect(requestId).toBe("test-request-id");
	});

	test("uses generator a new request id if there's nothing in the header", async () => {
		let [middleware, getRequestID] = createRequestIDMiddleware({
			generator: () => "test-request-id",
		});

		let context = new RouterContextProvider();

		await runMiddleware(middleware, { context });

		let requestId = getRequestID(context);

		expect(requestId).toBe("test-request-id");
	});

	test("uses generator a new request id if the header is too long", async () => {
		let [middleware, getRequestID] = createRequestIDMiddleware({
			generator: () => "test-request-id",
		});

		let request = new Request("https://remix.run", {
			headers: {
				"X-Request-ID": "a".repeat(256),
			},
		});

		let context = new RouterContextProvider();

		await runMiddleware(middleware, { request, context });

		let requestId = getRequestID(context);

		expect(requestId).toBe("test-request-id");
	});

	test("uses generator a new request id if the header contains invalid characters", async () => {
		let [middleware, getRequestID] = createRequestIDMiddleware({
			generator: () => "test-request-id",
		});

		let request = new Request("https://remix.run", {
			headers: {
				"X-Request-ID": "test-request-id!",
			},
		});

		let context = new RouterContextProvider();

		await runMiddleware(middleware, { request, context });

		let requestId = getRequestID(context);

		expect(requestId).toBe("test-request-id");
	});

	test("uses generator a new request id if header is disabled", async () => {
		let [middleware, getRequestID] = createRequestIDMiddleware({
			header: null,
		});

		let request = new Request("https://remix.run", {
			headers: {
				"X-Request-ID": "test-request-id",
			},
		});

		let context = new RouterContextProvider();

		await runMiddleware(middleware, { request, context });

		let requestId = getRequestID(context);

		expect(requestId).toBeString();
		expect(requestId).not.toBe("test-request-id");
	});

	test("uses default generator if none is provided", async () => {
		let [middleware, getRequestID] = createRequestIDMiddleware();

		let context = new RouterContextProvider();

		await runMiddleware(middleware, { context });

		let requestId = getRequestID(context);

		expect(requestId).toBeString();
	});

	test("uses user-provided header name to find header", async () => {
		let [middleware, getRequestID] = createRequestIDMiddleware({
			header: "X-My-Request-ID",
		});

		let request = new Request("https://remix.run", {
			headers: {
				"X-My-Request-ID": "test-request-id",
			},
		});

		let context = new RouterContextProvider();

		await runMiddleware(middleware, { request, context });

		let requestId = getRequestID(context);

		expect(requestId).toBe("test-request-id");
	});
});
