import { describe, expect, test } from "vitest";
import { redirectBack } from "../../src/server/redirect-back";

describe(redirectBack, () => {
	test("uses the referer if available", () => {
		const request = new Request("http://remix.utils/", {
			headers: { Referer: "/referer" },
		});
		const response = redirectBack(request, { fallback: "/fallback" });
		expect(response.headers.get("Location")).toBe("/referer");
	});

	test("uses the fallback if referer is not available", () => {
		const request = new Request("http://remix.utils/");
		const response = redirectBack(request, { fallback: "/fallback" });
		expect(response.headers.get("Location")).toBe("/fallback");
	});
});
