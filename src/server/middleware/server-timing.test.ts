import { describe, expect, test } from "bun:test";
import { TimingCollector } from "@edgefirst-dev/server-timing";
import { unstable_RouterContextProvider } from "react-router";
import { unstable_createServerTimingMiddleware } from "./server-timing.js";
import { runMiddleware } from "./test-helper.js";

describe(unstable_createServerTimingMiddleware, () => {
	test("the middleware function sets a TimingCollector instance in the context and adds the server timing headers to the response", async () => {
		let [middleware, getTimingCollector] =
			unstable_createServerTimingMiddleware();

		let request = new Request("https://remix.utils");
		let context = new unstable_RouterContextProvider();

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
			unstable_createServerTimingMiddleware();

		let context = new unstable_RouterContextProvider();

		await runMiddleware(middleware, { context });

		expect(getTimingCollector(context)).toBeInstanceOf(TimingCollector);
	});
});
