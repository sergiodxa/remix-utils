import { wait, interval, TimersError } from "../../src/common/timers";
import { describe, test, expect } from "vitest";

describe("Timers", () => {
	describe(wait.name, () => {
		test("should resolve after the specified time", async () => {
			let start = Date.now();
			await wait(100);
			let end = Date.now();
			expect(end - start).toBeGreaterThanOrEqual(100);
		});

		test("should reject if aborted", async () => {
			let controller = new AbortController();
			let start = Date.now();
			let promise = wait(100, { signal: controller.signal });
			controller.abort();
			await expect(promise).rejects.toThrowError(TimersError);
			let end = Date.now();
			expect(end - start).toBeLessThan(100);
		});
	});

	describe(interval.name, () => {
		test("should resolve after the specified time", async () => {
			let controller = new AbortController();
			let start = Date.now();
			let iterator = interval(100, { signal: controller.signal });
			let next = await iterator.next();
			let end = Date.now();
			expect(end - start).toBeGreaterThanOrEqual(100);
			expect(next.done).toBe(false);
			controller.abort();
		});

		test("should reject if aborted", async () => {
			let controller = new AbortController();
			let start = Date.now();
			let iterator = interval(100, { signal: controller.signal });
			controller.abort();
			let next = await iterator.next();
			let end = Date.now();
			expect(end - start).toBeLessThan(100);
			expect(next.done).toBe(true);
		});
	});
});
