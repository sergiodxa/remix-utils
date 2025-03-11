import { describe, expect, mock, test } from "bun:test";
import { Batcher } from "@edgefirst-dev/batcher";
import { unstable_RouterContextProvider } from "react-router";
import { unstable_createBatcherMiddleware } from "./batcher";

describe(unstable_createBatcherMiddleware.name, () => {
	test("creates a singleton middleware for a Batcher", async () => {
		let [middleware, getBatcher] = unstable_createBatcherMiddleware();

		let request = new Request("https://remix.utils");
		let params = {};
		let context = new unstable_RouterContextProvider();

		let next = mock().mockImplementation(() => Response.json(null));

		await middleware({ request, params, context }, next);

		let batcher = getBatcher(context);

		expect(batcher).toBeInstanceOf(Batcher);
	});
});
