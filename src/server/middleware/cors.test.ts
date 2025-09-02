import { describe, expect, test } from "bun:test";
import { unstable_createCorsMiddleware } from "./cors";
import { runMiddleware } from "./test-helper";

describe(unstable_createCorsMiddleware, () => {
	test("sets the CORS headers in the response", async () => {
		let [middleware] = unstable_createCorsMiddleware({
			origin: "*",
			methods: ["GET", "POST"],
		});

		let request = new Request("https://remix.utils", {
			method: "OPTIONS",
			headers: { Origin: "https://example.com" },
		});

		let response = await runMiddleware(middleware, {
			request,
			async next() {
				return Response.json(null);
			},
		});

		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
			"GET,POST",
		);
	});

	test("sets the CORS headers in the response with custom options", async () => {
		let [middleware] = unstable_createCorsMiddleware({
			origin: "https://example.com",
			methods: ["GET", "POST"],
			allowedHeaders: ["Content-Type"],
			exposedHeaders: ["X-Custom-Header"],
			credentials: true,
			maxAge: 3600,
		});

		let request = new Request("https://remix.utils", {
			method: "OPTIONS",
			headers: { Origin: "https://example.com" },
		});

		let response = await runMiddleware(middleware, {
			request,
			next: async () => Response.json(null),
		});

		expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
			"https://example.com",
		);
		expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
			"GET,POST",
		);
		expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
			"Content-Type",
		);
		expect(response.headers.get("Access-Control-Expose-Headers")).toBe(
			"X-Custom-Header",
		);
		expect(response.headers.get("Access-Control-Allow-Credentials")).toBe(
			"true",
		);
		expect(response.headers.get("Access-Control-Max-Age")).toBe("3600");
		expect(response.headers.get("Vary")).toBe("Origin");
	});
});
