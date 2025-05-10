import { describe, expect, test } from "bun:test";
import { unstable_RouterContextProvider } from "react-router";
import { unstable_createSingletonMiddleware } from "./singleton";
import { runMiddleware } from "./test-helper";

describe(unstable_createSingletonMiddleware, () => {
	test("creates an instance of a given class without arguments", async () => {
		let context = new unstable_RouterContextProvider();

		class Test {}

		let [middleware, getInstance] = unstable_createSingletonMiddleware({
			instantiator: () => new Test(),
		});

		await runMiddleware(middleware, { context });

		expect(getInstance(context)).toBeInstanceOf(Test);
	});

	test("creates an instance of a given class with arguments", async () => {
		let context = new unstable_RouterContextProvider();

		class Test {
			constructor(public arg: string) {}
		}

		let [middleware, getInstance] = unstable_createSingletonMiddleware({
			instantiator: () => new Test("test"),
		});

		await runMiddleware(middleware, { context });

		expect(getInstance(context)).toBeInstanceOf(Test);
	});

	test("returns the existing instance if it already exists", async () => {
		let context = new unstable_RouterContextProvider();

		class Test {}

		let [middleware, getInstance] = unstable_createSingletonMiddleware({
			instantiator: () => new Test(),
		});

		await runMiddleware(middleware, { context });

		let instance = getInstance(context);

		await runMiddleware(middleware, { context });

		expect(getInstance(context)).toBe(instance);
	});

	test("throws an error if the instance does not exist", async () => {
		let context = new unstable_RouterContextProvider();

		class Test {}

		let [_, getInstance] = unstable_createSingletonMiddleware({
			instantiator: () => new Test(),
		});

		expect(() => getInstance(context)).toThrowError(
			"Singleton instance not found",
		);
	});

	test("instantiator can access request and context", async () => {
		let context = new unstable_RouterContextProvider();
		let request = new Request("http://localhost");

		class Test {
			constructor(
				private request: Request,
				public context: unstable_RouterContextProvider,
			) {}

			get url() {
				return this.request.url;
			}
		}

		let [middleware, getInstance] = unstable_createSingletonMiddleware({
			instantiator: (req, ctx) => new Test(req, ctx),
		});

		await runMiddleware(middleware, { request, context });
		let instance = getInstance(context);
		expect(instance).toBeInstanceOf(Test);
		expect(instance.url).toBe(request.url);
		expect(instance.context).toBe(context);
	});
});
