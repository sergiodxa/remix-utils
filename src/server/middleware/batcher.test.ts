import { describe, expect, test } from "bun:test";
import { Batcher } from "@edgefirst-dev/batcher";
import { RouterContextProvider } from "react-router";
import { createBatcherMiddleware } from "./batcher.js";
import { runMiddleware } from "./test-helper.js";

describe(createBatcherMiddleware, () => {
	test("creates a singleton middleware for a Batcher", async () => {
		let [middleware, getBatcher] = createBatcherMiddleware();

		let context = new RouterContextProvider();

		await runMiddleware(middleware, { context });

		let batcher = getBatcher(context);

		expect(batcher).toBeInstanceOf(Batcher);
	});
});
