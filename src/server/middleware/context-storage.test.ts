import { describe, expect, test } from "bun:test";
import { RouterContextProvider } from "react-router";
import { createContextStorageMiddleware } from "./context-storage.js";
import { runMiddleware } from "./test-helper.js";

describe(createContextStorageMiddleware, () => {
	test("sets the RouterContextProvider in AsyncLocalStorage", async () => {
		let [middleware, getContext] = createContextStorageMiddleware();

		let context = new RouterContextProvider();

		await runMiddleware(middleware, {
			context,
			async next() {
				expect(getContext()).toBe(context);
				return Response.json(null);
			},
		});
	});

	test("sets the Request in AsyncLocalStorage", async () => {
		let [middleware, , getRequest] = createContextStorageMiddleware();

		let request = new Request("https://remix.utils");

		await runMiddleware(middleware, {
			request,
			async next() {
				expect(getRequest()).toBe(request);
				return Response.json(null);
			},
		});
	});
});
