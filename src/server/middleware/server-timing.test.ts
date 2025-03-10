import { describe, expect, mock, test } from "bun:test";
import { TimingCollector } from "@edgefirst-dev/server-timing";
import { unstable_RouterContextProvider } from "react-router";
import { unstable_createServerTimingMiddleware } from "./server-timing";

describe(unstable_createServerTimingMiddleware.name, () => {
	test("returns a middleware function and a function to get the TimingCollector instance from the context", () => {
		let [middleware, getTimingCollector] =
			unstable_createServerTimingMiddleware();

		expect(middleware).toBeFunction();
		expect(getTimingCollector).toBeFunction();
	});

	test("the middleware function sets a TimingCollector instance in the context and adds the server timing headers to the response", async () => {
		let [middleware, getTimingCollector] =
			unstable_createServerTimingMiddleware();

		let request = new Request("https://remix.utils");
		let params = {};
		let context = new unstable_RouterContextProvider();
		let next = mock().mockImplementation(async () => {
			let collector = getTimingCollector(context);
			await collector.measure("api", () => {
				return new Promise((resolve) => {
					setTimeout(resolve, 100);
				});
			});
			return Response.json({});
		});

		let response = await middleware({ request, params, context }, next);

		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get("Server-Timing")).toBeString();
	});

	test("the getTimingCollector function returns the TimingCollector instance from the context", () => {
		let [middleware, getTimingCollector] =
			unstable_createServerTimingMiddleware();

		let request = new Request("https://remix.utils");
		let params = {};
		let context = new unstable_RouterContextProvider();
		let next = mock().mockImplementation(() => Response.json({}));

		middleware({ request, params, context }, next);

		expect(getTimingCollector(context)).toBeInstanceOf(TimingCollector);
	});
});
