import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { TimersError, interval, wait } from "../../src/common/timers";

describe("Timers", () => {
	beforeAll(() => {
		vi.useFakeTimers();
	});

	afterAll(() => {
		vi.useRealTimers();
	});
	// TODO Fix this
	describe.skip(wait.name, () => {
		// TODO Fix this
		test("should resolve after the specified time", async () => {
			let start = Date.now();
			vi.advanceTimersByTimeAsync(100);
			await wait(100);
			let end = Date.now();
			expect(end - start).toBeGreaterThanOrEqual(100);
		});
		// TODO Fix this
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

	describe.skip(interval.name, () => {
		// TODO Fix this
		test.skip("should resolve after the specified time", async () => {
			let controller = new AbortController();
			let start = Date.now();
			vi.advanceTimersByTimeAsync(100);
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
