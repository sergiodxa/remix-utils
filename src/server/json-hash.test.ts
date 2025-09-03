import { describe, expect, test } from "bun:test";
import { jsonHash } from "./json-hash.js";

describe(jsonHash, () => {
	test("should return a response with a status code", async () => {
		let response = await jsonHash({}, 201);

		expect(response.data).toEqual({});
		expect(response.init?.status).toBe(201);
	});

	test("should return a response with custom headers", async () => {
		let response = await jsonHash({}, { headers: { "Set-Cookie": "COOKIE" } });
		expect(new Headers(response.init?.headers).get("Set-Cookie")).toBe(
			"COOKIE",
		);
	});

	test("should resolve loader data", async () => {
		let response = await jsonHash({
			foo() {
				return "foo";
			},
			bar: "bar",
			async baz() {
				return "baz";
			},
			qux: Promise.resolve("qux"),
		});

		expect(response.data).toEqual({
			foo: "foo",
			bar: "bar",
			baz: "baz",
			qux: "qux",
		});
	});
});
