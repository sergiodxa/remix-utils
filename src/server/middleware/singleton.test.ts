import { describe, expect, mock, test } from "bun:test";
import { unstable_RouterContextProvider } from "react-router";
import { unstable_createSingletonMiddleware } from "./singleton";

describe(unstable_createSingletonMiddleware.name, () => {
	test("creates an instance of a given class without arguments", async () => {
		let request = new Request("https://remix.utils");
		let params = {};
		let context = new unstable_RouterContextProvider();

		let next = mock().mockImplementation(() => Response.json(null));

		class Test {}

		let [middleware, getInstance] = unstable_createSingletonMiddleware({
			Class: Test,
			arguments: [],
		});

		await middleware({ request, params, context }, next);

		expect(getInstance(context)).toBeInstanceOf(Test);
	});

	test("creates an instance of a given class with arguments", async () => {
		let request = new Request("https://remix.utils");
		let params = {};
		let context = new unstable_RouterContextProvider();

		let next = mock().mockImplementation(() => Response.json(null));

		class Test {
			constructor(public arg: string) {}
		}

		let [middleware, getInstance] = unstable_createSingletonMiddleware({
			Class: Test,
			arguments: ["test"],
		});

		await middleware({ request, params, context }, next);

		expect(getInstance(context)).toBeInstanceOf(Test);
	});

	test("returns the existing instance if it already exists", async () => {
		let request = new Request("https://remix.utils");
		let params = {};
		let context = new unstable_RouterContextProvider();

		let next = mock().mockImplementation(() => Response.json(null));

		class Test {}

		let [middleware, getInstance] = unstable_createSingletonMiddleware({
			Class: Test,
			arguments: [],
		});

		await middleware({ request, params, context }, next);
		let instance = getInstance(context);

		await middleware({ request, params, context }, next);

		expect(getInstance(context)).toBe(instance);
	});

	test("throws an error if the instance does not exist", async () => {
		let request = new Request("https://remix.utils");
		let params = {};
		let context = new unstable_RouterContextProvider();

		class Test {}

		let [_, getInstance] = unstable_createSingletonMiddleware({
			Class: Test,
			arguments: [],
		});

		expect(() => getInstance(context)).toThrowError(
			"Singleton instance not found",
		);
	});
});
