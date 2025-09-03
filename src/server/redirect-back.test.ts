import { describe, expect, test } from "bun:test";
import { redirectBack } from "./redirect-back.js";

describe(redirectBack, () => {
	test("uses the referer if available", () => {
		let request = new Request("http://remix.utils/", {
			headers: { Referer: "/referer" },
		});
		let response = redirectBack(request, { fallback: "/fallback" });
		expect(new Headers(response.init?.headers).get("Location")).toBe(
			"/referer",
		);
	});

	test("uses the fallback if referer is not available", () => {
		let request = new Request("http://remix.utils/");
		let response = redirectBack(request, { fallback: "/fallback" });
		expect(new Headers(response.init?.headers).get("Location")).toBe(
			"/fallback",
		);
	});
});
