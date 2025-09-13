import { describe, expect, test } from "bun:test";
import { RouterContextProvider } from "react-router";
import { createSingletonMiddleware } from "./singleton.js";
import { runMiddleware } from "./test-helper.js";

describe(createSingletonMiddleware, () => {
	test("creates an instance of a given class without arguments", async () => {
		let context = new RouterContextProvider();

		class Test {}

		let [middleware, getInstance] = createSingletonMiddleware({
			instantiator: () => new Test(),
		});

		await runMiddleware(middleware, { context });

		expect(getInstance(context)).toBeInstanceOf(Test);
	});

	test("creates an instance of a given class with arguments", async () => {
		let context = new RouterContextProvider();

		class Test {
			constructor(public arg: string) {}
		}

		let [middleware, getInstance] = createSingletonMiddleware({
			instantiator: () => new Test("test"),
		});

		await runMiddleware(middleware, { context });

		expect(getInstance(context)).toBeInstanceOf(Test);
	});

	test("returns the existing instance if it already exists", async () => {
		let context = new RouterContextProvider();

		class Test {}

		let [middleware, getInstance] = createSingletonMiddleware({
			instantiator: () => new Test(),
		});

		await runMiddleware(middleware, { context });

		let instance = getInstance(context);

		await runMiddleware(middleware, { context });

		expect(getInstance(context)).toBe(instance);
	});

	test("throws an error if the instance does not exist", async () => {
		let context = new RouterContextProvider();

		class Test {}

		let [_, getInstance] = createSingletonMiddleware({
			instantiator: () => new Test(),
		});

		expect(() => getInstance(context)).toThrowError(
			"Singleton instance not found",
		);
	});

	test("instantiator can access request and context", async () => {
		let context = new RouterContextProvider();
		let request = new Request("http://localhost");

		class Test {
			constructor(
				private request: Request,
				public context: Readonly<RouterContextProvider>,
			) {}

			get url() {
				return this.request.url;
			}
		}

		let [middleware, getInstance] = createSingletonMiddleware({
			instantiator: (req, ctx) => new Test(req, ctx),
		});

		await runMiddleware(middleware, { request, context });
		let instance = getInstance(context);
		expect(instance).toBeInstanceOf(Test);
		expect(instance.url).toBe(request.url);
		expect(instance.context).toBe(context);
	});
});
