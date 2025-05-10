import { describe, expect, setSystemTime, test } from "bun:test";
import { interval } from "./timers";

describe("Timers", () => {
	describe(interval, () => {
		// TODO Fix this
		test("should resolve after the specified time", async () => {
			setSystemTime(0);
			let controller = new AbortController();
			let start = Date.now();
			setSystemTime(100);
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
