import { describe, expect, test } from "vitest";
import { isPrefetch } from "../../src/server/is-prefetch";

describe(isPrefetch, () => {
	test.each([
		"Purpose",
		"X-Purpose",
		"Sec-Purpose",
		"Sec-Fetch-Purpose",
		"Moz-Purpose",
		"X-Moz",
	])("should return true when %s is set to prefetch", (header) => {
		let request = new Request("https://example.com/", {
			headers: { [header]: "prefetch" },
		});
		expect(isPrefetch(request)).toBe(true);
	});

	test("should return false if it's not a prefetch", () => {
		let request = new Request("https://example.com/");
		expect(isPrefetch(request)).toBe(false);
	});
});
