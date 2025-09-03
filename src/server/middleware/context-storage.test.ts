import { describe, expect, test } from "bun:test";
import { unstable_RouterContextProvider } from "react-router";
import { unstable_createContextStorageMiddleware } from "./context-storage.js";
import { runMiddleware } from "./test-helper.js";

describe(unstable_createContextStorageMiddleware, () => {
	test("sets the RouterContextProvider in AsyncLocalStorage", async () => {
		let [middleware, getContext] = unstable_createContextStorageMiddleware();

		let context = new unstable_RouterContextProvider();

		await runMiddleware(middleware, {
			context,
			async next() {
				expect(getContext()).toBe(context);
				return Response.json(null);
			},
		});
	});

	test("sets the Request in AsyncLocalStorage", async () => {
		let [middleware, , getRequest] = unstable_createContextStorageMiddleware();

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
