import { describe, expect, test } from "bun:test";
import {
	FetchDestValues,
	FetchModeValues,
	FetchSiteValues,
	fetchDest,
	fetchMode,
	fetchSite,
	isUserInitiated,
} from "./sec-fetch.js";

describe(fetchDest, () => {
	test("returns null if no Sec-Fetch-Dest header is present", () => {
		let request = new Request("http://example.com");
		expect(fetchDest(request)).toBeNull();
	});

	test.each(FetchDestValues)(
		"returns the correct FetchDest value '%s'",
		(value) => {
			let request = new Request("http://example.com", {
				headers: {
					"Sec-Fetch-Dest": value,
				},
			});
			expect(fetchDest(request)).toBe(value);
		},
	);
});

describe(fetchMode, () => {
	test("returns null if no Sec-Fetch-Mode header is present", () => {
		let request = new Request("http://example.com");
		expect(fetchMode(request)).toBeNull();
	});

	test.each(FetchModeValues)(
		"returns the correct FetchMode value '%s'",
		(value) => {
			let request = new Request("http://example.com", {
				headers: {
					"Sec-Fetch-Mode": value,
				},
			});
			expect(fetchMode(request)).toBe(value);
		},
	);
});

describe(fetchSite, () => {
	test("returns null if no Sec-Fetch-Site header is present", () => {
		let request = new Request("http://example.com");
		expect(fetchSite(request)).toBeNull();
	});

	test.each(FetchSiteValues)(
		"returns the correct FetchSite value '%s'",
		(value) => {
			let request = new Request("http://example.com", {
				headers: {
					"Sec-Fetch-Site": value,
				},
			});

			expect(fetchSite(request)).toBe(value);
		},
	);
});

describe(isUserInitiated, () => {
	test("returns false if no Sec-Fetch-User header is present", () => {
		let request = new Request("http://example.com");
		expect(isUserInitiated(request)).toBe(false);
	});

	test("returns true if Sec-Fetch-User header is '?1'", () => {
		let request = new Request("http://example.com", {
			headers: {
				"Sec-Fetch-User": "?1",
			},
		});
		expect(isUserInitiated(request)).toBe(true);
	});

	test("returns false if Sec-Fetch-User header is not '?1'", () => {
		let request = new Request("http://example.com", {
			headers: {
				"Sec-Fetch-User": "?0",
			},
		});
		expect(isUserInitiated(request)).toBe(false);
	});
});
