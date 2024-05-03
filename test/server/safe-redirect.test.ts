import { describe, expect, test } from "vitest";
import { safeRedirect } from "../../src/server/safe-redirect";

describe(safeRedirect.name, () => {
	test.each(["/home", "/home?foo=bar", "/home#foo"])("Is valid %s", (to) => {
		expect(safeRedirect(to)).toBe(to);
	});

	test.each([
		"",
		" ",
		"foo",
		"foo/bar",
		"http://remix.utils",
		null,
		undefined,
		"mailto:remix@utils.com",
		"//remix.utils",
	])("is invalid %s", (to) => {
		expect(safeRedirect(to)).toBe("/");
	});

	test("uses default redirect", () => {
		expect(safeRedirect(null, "/login")).toBe("/login");
	});

	test("considers invalid /\\", () => {
		expect(safeRedirect("/\\", "/login")).toBe("/login");
	});
});
