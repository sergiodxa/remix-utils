import { describe, expect, test } from "bun:test";
import { Batcher } from "@edgefirst-dev/batcher";
import { unstable_RouterContextProvider } from "react-router";
import { unstable_createBatcherMiddleware } from "./batcher";
import { runMiddleware } from "./test-helper";

describe(unstable_createBatcherMiddleware.name, () => {
	test("creates a singleton middleware for a Batcher", async () => {
		let [middleware, getBatcher] = unstable_createBatcherMiddleware();

		let context = new unstable_RouterContextProvider();

		await runMiddleware(middleware, { context });

		let batcher = getBatcher(context);

		expect(batcher).toBeInstanceOf(Batcher);
	});
});
