import { describe, expect, mock, test } from "bun:test";
import { unstable_RouterContextProvider } from "react-router";
import { unstable_createRequestIDMiddleware } from "./request-id";

describe(unstable_createRequestIDMiddleware.name, () => {
	test("gets the request id from the X-Request-ID header", async () => {
		let [middleware, getRequestID] = unstable_createRequestIDMiddleware();

		let request = new Request("https://remix.run", {
			headers: {
				"X-Request-ID": "test-request-id",
			},
		});
		let params = {};
		let context = new unstable_RouterContextProvider();

		let next = mock().mockImplementation(() => Response.json(null));

		await middleware({ request, params, context }, next);

		let requestId = getRequestID(context);

		expect(requestId).toBe("test-request-id");
	});

	test("uses generator a new request id if there's nothing in the header", async () => {
		let [middleware, getRequestID] = unstable_createRequestIDMiddleware({
			generator: () => "test-request-id",
		});

		let request = new Request("https://remix.run");
		let params = {};
		let context = new unstable_RouterContextProvider();

		let next = mock().mockImplementation(() => Response.json(null));

		await middleware({ request, params, context }, next);

		let requestId = getRequestID(context);

		expect(requestId).toBe("test-request-id");
	});

	test("uses generator a new request id if the header is too long", async () => {
		let [middleware, getRequestID] = unstable_createRequestIDMiddleware({
			generator: () => "test-request-id",
		});

		let request = new Request("https://remix.run", {
			headers: {
				"X-Request-ID": "a".repeat(256),
			},
		});

		let params = {};
		let context = new unstable_RouterContextProvider();

		let next = mock().mockImplementation(() => Response.json(null));

		await middleware({ request, params, context }, next);

		let requestId = getRequestID(context);

		expect(requestId).toBe("test-request-id");
	});

	test("uses generator a new request id if the header contains invalid characters", async () => {
		let [middleware, getRequestID] = unstable_createRequestIDMiddleware({
			generator: () => "test-request-id",
		});

		let request = new Request("https://remix.run", {
			headers: {
				"X-Request-ID": "test-request-id!",
			},
		});

		let params = {};
		let context = new unstable_RouterContextProvider();

		let next = mock().mockImplementation(() => Response.json(null));

		await middleware({ request, params, context }, next);

		let requestId = getRequestID(context);

		expect(requestId).toBe("test-request-id");
	});

	test("uses default generator if none is provided", async () => {
		let [middleware, getRequestID] = unstable_createRequestIDMiddleware();

		let request = new Request("https://remix.run");
		let params = {};
		let context = new unstable_RouterContextProvider();

		let next = mock().mockImplementation(() => Response.json(null));

		await middleware({ request, params, context }, next);

		let requestId = getRequestID(context);

		expect(requestId).toBeString();
	});

	test("uses user-provided header name to find header", async () => {
		let [middleware, getRequestID] = unstable_createRequestIDMiddleware({
			header: "X-My-Request-ID",
		});

		let request = new Request("https://remix.run", {
			headers: {
				"X-My-Request-ID": "test-request-id",
			},
		});

		let params = {};
		let context = new unstable_RouterContextProvider();

		let next = mock().mockImplementation(() => Response.json(null));

		await middleware({ request, params, context }, next);

		let requestId = getRequestID(context);

		expect(requestId).toBe("test-request-id");
	});
});
