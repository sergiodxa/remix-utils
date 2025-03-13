import { describe, expect, test } from "bun:test";
import { unstable_RouterContextProvider } from "react-router";
import { unstable_createSingletonMiddleware } from "./singleton";
import { runMiddleware } from "./test-helper";

describe(unstable_createSingletonMiddleware.name, () => {
	test("creates an instance of a given class without arguments", async () => {
		let context = new unstable_RouterContextProvider();

		class Test {}

		let [middleware, getInstance] = unstable_createSingletonMiddleware({
			Class: Test,
			arguments: [],
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
			Class: Test,
			arguments: ["test"],
		});

		await runMiddleware(middleware, { context });

		expect(getInstance(context)).toBeInstanceOf(Test);
	});

	test("returns the existing instance if it already exists", async () => {
		let context = new unstable_RouterContextProvider();

		class Test {}

		let [middleware, getInstance] = unstable_createSingletonMiddleware({
			Class: Test,
			arguments: [],
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
			Class: Test,
			arguments: [],
		});

		expect(() => getInstance(context)).toThrowError(
			"Singleton instance not found",
		);
	});
});
