import { describe, expect, mock, spyOn, test } from "bun:test";
import { unstable_createLoggerMiddleware } from "./logger";
import { runMiddleware } from "./test-helper";

describe(unstable_createLoggerMiddleware, () => {
	spyOn(performance, "now").mockImplementation(() => 0);

	const logger = {
		error: mock(),
		warn: mock(),
		info: mock(),
		debug: mock(),
	};

	test("returns a middleware function", () => {
		let [middleware] = unstable_createLoggerMiddleware();
		expect(middleware).toBeFunction();
	});

	test("on a 2xx logs info of the request/response", async () => {
		let [middleware] = unstable_createLoggerMiddleware({ logger });

		await runMiddleware(middleware);

		expect(logger.info).toHaveBeenCalledWith("GET / 200 0.00 ms");
	});

	test("on a 3xx logs debug of the redirect", async () => {
		let [middleware] = unstable_createLoggerMiddleware({ logger });

		await runMiddleware(middleware, {
			async next() {
				return new Response(null, {
					status: 301,
					headers: { location: "/new" },
				});
			},
		});

		expect(logger.debug).toHaveBeenCalledWith("GET / → /new");
	});

	test("on a 4xx logs warn of the request/response", async () => {
		let [middleware] = unstable_createLoggerMiddleware({ logger });

		await runMiddleware(middleware, {
			async next() {
				return new Response("Not Found", { status: 404 });
			},
		});

		expect(logger.warn).toHaveBeenCalledWith("GET / 404 0.00 ms");
	});

	test("on a 5xx logs error of the request/response", async () => {
		let [middleware] = unstable_createLoggerMiddleware({ logger });

		await runMiddleware(middleware, {
			async next() {
				return new Response("Internal Server Error", { status: 500 });
			},
		});

		expect(logger.error).toHaveBeenCalledWith("GET / 500 0.00 ms");
	});

	test("the logged message can be customized", async () => {
		let [middleware] = unstable_createLoggerMiddleware({
			logger,
			formatMessage(request, response, responseTime) {
				return `${request.method}`;
			},
		});

		await runMiddleware(middleware);

		expect(logger.info).toHaveBeenCalledWith("GET");
	});
});
