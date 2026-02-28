import { describe, expect, mock, test } from "bun:test";
import { RouterContextProvider } from "react-router";
import { createCsrfMiddleware } from "./csrf.js";
import { catchResponse, runMiddleware } from "./test-helper.js";

describe(createCsrfMiddleware, () => {
	test("returns a middleware function", () => {
		let middleware = createCsrfMiddleware();
		expect(middleware).toBeFunction();
	});

	test.each(["GET", "HEAD", "OPTIONS"])(
		"allows safe method %s by default",
		async (method) => {
			let middleware = createCsrfMiddleware();

			let request = new Request("https://remix.utils", { method });
			let response = await runMiddleware(middleware, { request });
			expect(response.status).toBe(200);
		},
	);

	test("allows custom safe methods", async () => {
		let middleware = createCsrfMiddleware({ safeMethods: ["GET", "POST"] });

		let request = new Request("https://remix.utils", { method: "POST" });
		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("allows same-origin requests", async () => {
		let middleware = createCsrfMiddleware();

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: { "Sec-Fetch-Site": "same-origin" },
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("allows same-site requests", async () => {
		let middleware = createCsrfMiddleware();

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: { "Sec-Fetch-Site": "same-site" },
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("rejects cross-site requests without origin option", async () => {
		let middleware = createCsrfMiddleware();

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: { "Sec-Fetch-Site": "cross-site" },
		});

		let response = await catchResponse(runMiddleware(middleware, { request }));
		expect(response.status).toBe(403);
	});

	test("rejects requests with no Sec-Fetch-Site header", async () => {
		let middleware = createCsrfMiddleware();

		let request = new Request("https://remix.utils", { method: "POST" });

		let response = await catchResponse(runMiddleware(middleware, { request }));
		expect(response.status).toBe(403);
	});

	test("allows cross-site requests with matching string origin", async () => {
		let middleware = createCsrfMiddleware({
			origin: "https://trusted.com",
		});

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: {
				"Sec-Fetch-Site": "cross-site",
				Referer: "https://trusted.com/page",
			},
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("rejects cross-site requests with non-matching string origin", async () => {
		let middleware = createCsrfMiddleware({
			origin: "https://trusted.com",
		});

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: {
				"Sec-Fetch-Site": "cross-site",
				Referer: "https://untrusted.com/page",
			},
		});

		let response = await catchResponse(runMiddleware(middleware, { request }));
		expect(response.status).toBe(403);
	});

	test("allows cross-site requests with matching RegExp origin", async () => {
		let middleware = createCsrfMiddleware({
			origin: /\.trusted\.com$/,
		});

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: {
				"Sec-Fetch-Site": "cross-site",
				Referer: "https://sub.trusted.com/page",
			},
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("rejects cross-site requests with non-matching RegExp origin", async () => {
		let middleware = createCsrfMiddleware({
			origin: /\.trusted\.com$/,
		});

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: {
				"Sec-Fetch-Site": "cross-site",
				Referer: "https://untrusted.com/page",
			},
		});

		let response = await catchResponse(runMiddleware(middleware, { request }));
		expect(response.status).toBe(403);
	});

	test("allows cross-site requests with matching origin in array", async () => {
		let middleware = createCsrfMiddleware({
			origin: ["https://trusted1.com", "https://trusted2.com"],
		});

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: {
				"Sec-Fetch-Site": "cross-site",
				Referer: "https://trusted2.com/page",
			},
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("allows cross-site requests with matching RegExp in array", async () => {
		let middleware = createCsrfMiddleware({
			origin: ["https://trusted1.com", /\.trusted\.com$/],
		});

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: {
				"Sec-Fetch-Site": "cross-site",
				Referer: "https://sub.trusted.com/page",
			},
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("allows cross-site requests when origin function returns true", async () => {
		let middleware = createCsrfMiddleware({
			origin: (origin) => origin === "https://trusted.com",
		});

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: {
				"Sec-Fetch-Site": "cross-site",
				Referer: "https://trusted.com/page",
			},
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("rejects cross-site requests when origin function returns false", async () => {
		let middleware = createCsrfMiddleware({
			origin: (origin) => origin === "https://trusted.com",
		});

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: {
				"Sec-Fetch-Site": "cross-site",
				Referer: "https://untrusted.com/page",
			},
		});

		let response = await catchResponse(runMiddleware(middleware, { request }));
		expect(response.status).toBe(403);
	});

	test("supports async origin function", async () => {
		let middleware = createCsrfMiddleware({
			origin: async (origin) => origin === "https://trusted.com",
		});

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: {
				"Sec-Fetch-Site": "cross-site",
				Referer: "https://trusted.com/page",
			},
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("allows missing referrer when allowMissingOrigin is true", async () => {
		let middleware = createCsrfMiddleware({
			origin: "https://trusted.com",
			allowMissingOrigin: true,
		});

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: { "Sec-Fetch-Site": "cross-site" },
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("uses custom onUntrustedRequest handler", async () => {
		let middleware = createCsrfMiddleware({
			onUntrustedRequest() {
				return new Response("Custom forbidden", { status: 418 });
			},
		});

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: { "Sec-Fetch-Site": "cross-site" },
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(418);
		expect(await response.text()).toBe("Custom forbidden");
	});

	test("passes request and context to onUntrustedRequest", async () => {
		let onUntrustedRequest =
			mock<createCsrfMiddleware.UntrustedRequestHandler>().mockImplementationOnce(
				() => new Response("Forbidden", { status: 403 }),
			);

		let middleware = createCsrfMiddleware({ onUntrustedRequest });

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: { "Sec-Fetch-Site": "cross-site" },
		});

		let context = new RouterContextProvider();

		await runMiddleware(middleware, { request, context });

		expect(onUntrustedRequest).toHaveBeenCalledWith(request, context);
	});

	test("passes request and context to origin function", async () => {
		let origin =
			mock<createCsrfMiddleware.OriginResolver>().mockImplementationOnce(
				() => true,
			);

		let middleware = createCsrfMiddleware({ origin });

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: {
				"Sec-Fetch-Site": "cross-site",
				Referer: "https://trusted.com/page",
			},
		});

		let context = new RouterContextProvider();

		await runMiddleware(middleware, { request, context });

		expect(origin).toHaveBeenCalledWith(
			"https://trusted.com",
			request,
			context,
		);
	});

	test("uses Origin header over Referer header", async () => {
		let middleware = createCsrfMiddleware({
			origin: "https://origin-header.com",
		});

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: {
				"Sec-Fetch-Site": "cross-site",
				Origin: "https://origin-header.com",
				Referer: "https://referer-header.com/page",
			},
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("falls back to Referer header when Origin is not present", async () => {
		let middleware = createCsrfMiddleware({
			origin: "https://referer-header.com",
		});

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: {
				"Sec-Fetch-Site": "cross-site",
				Referer: "https://referer-header.com/page",
			},
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("rejects request when origin header is invalid URL", async () => {
		let middleware = createCsrfMiddleware({
			origin: "https://trusted.com",
		});

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: {
				"Sec-Fetch-Site": "cross-site",
				Origin: "not-a-valid-url",
			},
		});

		let response = await catchResponse(runMiddleware(middleware, { request }));
		expect(response.status).toBe(403);
	});

	test("allows invalid origin when allowMissingOrigin is true", async () => {
		let middleware = createCsrfMiddleware({
			origin: "https://trusted.com",
			allowMissingOrigin: true,
		});

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: {
				"Sec-Fetch-Site": "cross-site",
				Origin: "not-a-valid-url",
			},
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});
});
