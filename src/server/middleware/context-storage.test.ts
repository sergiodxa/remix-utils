import { describe, expect, test } from "bun:test";
import { unstable_RouterContextProvider } from "react-router";
import { unstable_createContextStorageMiddleware } from "./context-storage";
import { runMiddleware } from "./test-helper";

describe(unstable_createContextStorageMiddleware.name, () => {
	test("sets the RouterContextProvider in AsyncLocalStorage", async () => {
		let [middleware, getContext] = unstable_createContextStorageMiddleware();

		let context = new unstable_RouterContextProvider();

		await runMiddleware(middleware, {
			context,
			next() {
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
			next() {
				expect(getRequest()).toBe(request);
				return Response.json(null);
			},
		});
	});
});
