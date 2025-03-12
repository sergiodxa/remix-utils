import { describe, expect, test } from "bun:test";
import { unstable_RouterContextProvider } from "react-router";
import { unstable_createContextStorageMiddleware } from "./context-storage";

describe(unstable_createContextStorageMiddleware.name, () => {
	test("sets the RouterContextProvider in AsyncLocalStorage", async () => {
		let [middleware, getContext] = unstable_createContextStorageMiddleware();

		let request = new Request("https://remix.utils");
		let params = {};
		let context = new unstable_RouterContextProvider();

		await middleware({ request, params, context }, () => {
			expect(getContext()).toBe(context);
			return Response.json(null);
		});
	});

	test("sets the Request in AsyncLocalStorage", async () => {
		let [middleware, , getRequest] = unstable_createContextStorageMiddleware();

		let request = new Request("https://remix.utils");
		let params = {};
		let context = new unstable_RouterContextProvider();

		await middleware({ request, params, context }, () => {
			expect(getRequest()).toBe(request);
			return Response.json(null);
		});
	});
});
