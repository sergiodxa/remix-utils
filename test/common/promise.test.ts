import { describe, expect, test } from "bun:test";
import { promiseHash, timeout } from "../../src/common/promise";

describe(promiseHash.name, () => {
	test("should await all promises in a hash and return them with the same name", async () => {
		let result = await promiseHash({
			a: Promise.resolve(1),
			b: Promise.resolve(2),
			c: Promise.resolve(3),
		});

		expect(result).toEqual({ a: 1, b: 2, c: 3 });
	});

	test("should work with nested objects", async () => {
		let result = await promiseHash({
			a: promiseHash({ b: Promise.resolve(1), c: Promise.resolve(2) }),
			d: promiseHash({ e: Promise.resolve(3), f: Promise.resolve(4) }),
		});

		expect(result).toEqual({
			a: { b: 1, c: 2 },
			d: { e: 3, f: 4 },
		});
	});
});

describe(timeout.name, () => {
	test("resolves if the promise resolves before the timeout", async () => {
		expect(timeout(Promise.resolve(1), { ms: 1000 })).resolves.toBe(1);
	});

	test("rejects if the promise rejects before the timeout", async () => {
		expect(timeout(Promise.reject(1), { ms: 1000 })).rejects.toBe(1);
	});

	test("rejects if the timeout resolves first", async () => {
		let timer: NodeJS.Timeout | null = null;

		let promise = new Promise((resolve) => {
			timer = setTimeout(resolve, 1000);
		});

		expect(timeout(promise, { ms: 1 })).rejects.toThrow(
      "Timed out after 1ms"
    );

		if (timer) clearTimeout(timer);
	});

	test("timeout aborts the controller", async () => {
		let controller = new AbortController();
		let timer: NodeJS.Timeout | null = null;

		let promise = new Promise((resolve) => {
			timer = setTimeout(resolve, 1000);
		});

		expect(timeout(promise, { ms: 10, controller })).rejects.toThrow(
      "Timed out after 10ms"
    );

		if (timer) clearTimeout(timer);

		expect(controller.signal.aborted).toBe(true);
	});
});
