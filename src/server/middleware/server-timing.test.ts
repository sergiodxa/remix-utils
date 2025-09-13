import { describe, expect, test } from "bun:test";
import { TimingCollector } from "@edgefirst-dev/server-timing";
import { RouterContextProvider } from "react-router";
import { createServerTimingMiddleware } from "./server-timing.js";
import { runMiddleware } from "./test-helper.js";

describe(createServerTimingMiddleware, () => {
	test("the middleware function sets a TimingCollector instance in the context and adds the server timing headers to the response", async () => {
		let [middleware, getTimingCollector] =
			createServerTimingMiddleware();

		let request = new Request("https://remix.utils");
		let context = new RouterContextProvider();

		let response = await runMiddleware(middleware, {
			request,
			context,
			async next() {
				let collector = getTimingCollector(context);
				await collector.measure("api", () => {
					return new Promise((resolve) => {
						setTimeout(resolve, 100);
					});
				});
				return Response.json({});
			},
		});

		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get("Server-Timing")).toBeString();
	});

	test("the getTimingCollector function returns the TimingCollector instance from the context", async () => {
		let [middleware, getTimingCollector] =
			createServerTimingMiddleware();

		let context = new RouterContextProvider();

		await runMiddleware(middleware, { context });

		expect(getTimingCollector(context)).toBeInstanceOf(TimingCollector);
	});
});
