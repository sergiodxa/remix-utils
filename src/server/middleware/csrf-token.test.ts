import { describe, expect, mock, test } from "bun:test";
import { createCookie, RouterContextProvider } from "react-router";
import { CSRFError } from "../csrf.js";
import { createCsrfTokenMiddleware } from "./csrf-token.js";
import { catchResponse, runMiddleware } from "./test-helper.js";

describe(createCsrfTokenMiddleware, () => {
	let cookie = createCookie("csrf", { secrets: ["s3cr3t"] });

	test("returns a tuple with middleware and getter", () => {
		let [middleware, getToken] = createCsrfTokenMiddleware({ cookie });
		expect(middleware).toBeFunction();
		expect(getToken).toBeFunction();
	});

	test.each(["GET", "HEAD", "OPTIONS"])("allows safe method %s by default", async (method) => {
		let [middleware] = createCsrfTokenMiddleware({ cookie });

		let request = new Request("https://remix.utils", { method });
		let response = await runMiddleware(middleware, { request });
    expect(response.status).toBe(200);
	});

	test("sets CSRF token cookie on first request", async () => {
		let [middleware] = createCsrfTokenMiddleware({ cookie });

		let request = new Request("https://remix.utils", { method: "GET" });
		let response = await runMiddleware(middleware, { request });

		expect(response.headers.get("Set-Cookie")).toContain("csrf=");
	});

	test("does not set cookie if token already exists", async () => {
		let [middleware, _getToken] = createCsrfTokenMiddleware({ cookie });

		// First request to get a token
		let context1 = new RouterContextProvider();
		let request1 = new Request("https://remix.utils", { method: "GET" });
		let response1 = await runMiddleware(middleware, {
			request: request1,
			context: context1,
		});
		let setCookie = response1.headers.get("Set-Cookie");
		expect(setCookie).not.toBeNull();

		// Second request with existing cookie
		let context2 = new RouterContextProvider();
		let request2 = new Request("https://remix.utils", {
			method: "GET",
			headers: { Cookie: setCookie! },
		});
		let response2 = await runMiddleware(middleware, {
			request: request2,
			context: context2,
		});

		expect(response2.headers.get("Set-Cookie")).toBeNull();
	});

	test("provides token via getCsrfToken", async () => {
		let [middleware, getToken] = createCsrfTokenMiddleware({ cookie });

		let context = new RouterContextProvider();
		let request = new Request("https://remix.utils", { method: "GET" });
		await runMiddleware(middleware, { request, context });

		let token = getToken(context);
		expect(token).toBeTypeOf("string");
		expect(token.length).toBeGreaterThan(0);
	});

	test("validates CSRF token on POST request", async () => {
		let [middleware, getToken] = createCsrfTokenMiddleware({ cookie });

		// First, get a token
		let context1 = new RouterContextProvider();
		let request1 = new Request("https://remix.utils", { method: "GET" });
		let response1 = await runMiddleware(middleware, {
			request: request1,
			context: context1,
		});
		let token = getToken(context1);
		let setCookie = response1.headers.get("Set-Cookie")!;

		// Submit a valid form
		let formData = new FormData();
		formData.set("csrf", token);

		let request2 = new Request("https://remix.utils", {
			method: "POST",
			headers: { Cookie: setCookie },
			body: formData,
		});

		let response2 = await runMiddleware(middleware, { request: request2 });
		expect(response2.status).toBe(200);
	});

	test("rejects POST request without CSRF token", async () => {
		let [middleware] = createCsrfTokenMiddleware({ cookie });

		// Get a cookie first
		let request1 = new Request("https://remix.utils", { method: "GET" });
		let response1 = await runMiddleware(middleware, { request: request1 });
		let setCookie = response1.headers.get("Set-Cookie")!;

		// Submit form without token
		let formData = new FormData();
		formData.set("name", "test");

		let request2 = new Request("https://remix.utils", {
			method: "POST",
			headers: { Cookie: setCookie },
			body: formData,
		});

		let response2 = await catchResponse(
			runMiddleware(middleware, { request: request2 }),
		);
		expect(response2.status).toBe(403);
	});

	test("rejects POST request with wrong CSRF token", async () => {
		let [middleware] = createCsrfTokenMiddleware({ cookie });

		// Get a cookie first
		let request1 = new Request("https://remix.utils", { method: "GET" });
		let response1 = await runMiddleware(middleware, { request: request1 });
		let setCookie = response1.headers.get("Set-Cookie")!;

		// Submit form with wrong token
		let formData = new FormData();
		formData.set("csrf", "wrong-token");

		let request2 = new Request("https://remix.utils", {
			method: "POST",
			headers: { Cookie: setCookie },
			body: formData,
		});

		let response2 = await catchResponse(
			runMiddleware(middleware, { request: request2 }),
		);
		expect(response2.status).toBe(403);
	});

	test("rejects POST request without cookie", async () => {
		let [middleware] = createCsrfTokenMiddleware({ cookie });

		let formData = new FormData();
		formData.set("csrf", "some-token");

		let request = new Request("https://remix.utils", {
			method: "POST",
			body: formData,
		});

		let response = await catchResponse(runMiddleware(middleware, { request }));
		expect(response.status).toBe(403);
	});

	test("allows non-form POST requests without validation", async () => {
		let [middleware] = createCsrfTokenMiddleware({ cookie });

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ data: "test" }),
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("uses custom formDataKey", async () => {
		let [middleware, getToken] = createCsrfTokenMiddleware({
			cookie,
			formDataKey: "authenticity_token",
		});

		// Get a token
		let context1 = new RouterContextProvider();
		let request1 = new Request("https://remix.utils", { method: "GET" });
		let response1 = await runMiddleware(middleware, {
			request: request1,
			context: context1,
		});
		let token = getToken(context1);
		let setCookie = response1.headers.get("Set-Cookie")!;

		// Submit with custom key
		let formData = new FormData();
		formData.set("authenticity_token", token);

		let request2 = new Request("https://remix.utils", {
			method: "POST",
			headers: { Cookie: setCookie },
			body: formData,
		});

		let response2 = await runMiddleware(middleware, { request: request2 });
		expect(response2.status).toBe(200);
	});

	test("uses custom safeMethods", async () => {
		let [middleware] = createCsrfTokenMiddleware({
			cookie,
			safeMethods: ["GET", "HEAD", "OPTIONS", "POST"],
		});

		let formData = new FormData();
		let request = new Request("https://remix.utils", {
			method: "POST",
			body: formData,
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("calls custom onInvalidToken handler", async () => {
		let onInvalidToken =
			mock<createCsrfTokenMiddleware.InvalidTokenHandler>().mockImplementationOnce(
				(error) => {
					return new Response(`Custom error: ${error.code}`, { status: 418 });
				},
			);

		let [middleware] = createCsrfTokenMiddleware({
			cookie,
			onInvalidToken,
		});

		// Get a cookie first
		let request1 = new Request("https://remix.utils", { method: "GET" });
		let response1 = await runMiddleware(middleware, { request: request1 });
		let setCookie = response1.headers.get("Set-Cookie")!;

		// Submit form without token
		let formData = new FormData();
		formData.set("name", "test");

		let request2 = new Request("https://remix.utils", {
			method: "POST",
			headers: { Cookie: setCookie },
			body: formData,
		});

		let response2 = await runMiddleware(middleware, { request: request2 });
		expect(response2.status).toBe(418);
		expect(await response2.text()).toContain("missing_token_in_body");
		expect(onInvalidToken).toHaveBeenCalled();
	});

	test("passes CSRFError to onInvalidToken handler", async () => {
		let receivedError: CSRFError | undefined;

		let [middleware] = createCsrfTokenMiddleware({
			cookie,
			onInvalidToken(error) {
				receivedError = error;
				return new Response("Error", { status: 403 });
			},
		});

		let formData = new FormData();
		formData.set("csrf", "token");

		let request = new Request("https://remix.utils", {
			method: "POST",
			body: formData,
		});

		await runMiddleware(middleware, { request });

		expect(receivedError).toBeInstanceOf(CSRFError);
		expect(receivedError?.code).toBe("missing_token_in_cookie");
	});

	test("validates signed tokens with secret", async () => {
		let [middleware, getToken] = createCsrfTokenMiddleware({
			cookie,
			secret: "my-secret",
		});

		// Get a signed token
		let context1 = new RouterContextProvider();
		let request1 = new Request("https://remix.utils", { method: "GET" });
		let response1 = await runMiddleware(middleware, {
			request: request1,
			context: context1,
		});
		let token = getToken(context1);
		let setCookie = response1.headers.get("Set-Cookie")!;

		// Token should be signed (contains a dot)
		expect(token).toContain(".");

		// Submit with signed token
		let formData = new FormData();
		formData.set("csrf", token);

		let request2 = new Request("https://remix.utils", {
			method: "POST",
			headers: { Cookie: setCookie },
			body: formData,
		});

		let response2 = await runMiddleware(middleware, { request: request2 });
		expect(response2.status).toBe(200);
	});

	test("allows request from trusted origin (string)", async () => {
		let [middleware] = createCsrfTokenMiddleware({
			cookie,
			origin: "https://trusted.com",
		});

		let formData = new FormData();
		formData.set("name", "test");

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: { Origin: "https://trusted.com" },
			body: formData,
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("rejects request from untrusted origin (string)", async () => {
		let [middleware] = createCsrfTokenMiddleware({
			cookie,
			origin: "https://trusted.com",
		});

		let formData = new FormData();
		formData.set("name", "test");

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: { Origin: "https://untrusted.com" },
			body: formData,
		});

		let response = await catchResponse(runMiddleware(middleware, { request }));
		expect(response.status).toBe(403);
	});

	test("allows request from trusted origin (RegExp)", async () => {
		let [middleware] = createCsrfTokenMiddleware({
			cookie,
			origin: /\.trusted\.com$/,
		});

		let formData = new FormData();
		formData.set("name", "test");

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: { Origin: "https://sub.trusted.com" },
			body: formData,
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("allows request from trusted origin (array)", async () => {
		let [middleware] = createCsrfTokenMiddleware({
			cookie,
			origin: ["https://trusted1.com", "https://trusted2.com"],
		});

		let formData = new FormData();
		formData.set("name", "test");

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: { Origin: "https://trusted2.com" },
			body: formData,
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("allows request from trusted origin (function)", async () => {
		let [middleware] = createCsrfTokenMiddleware({
			cookie,
			origin: (origin) => origin === "https://trusted.com",
		});

		let formData = new FormData();
		formData.set("name", "test");

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: { Origin: "https://trusted.com" },
			body: formData,
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("allows request from trusted origin (async function)", async () => {
		let [middleware] = createCsrfTokenMiddleware({
			cookie,
			origin: async (origin) => origin === "https://trusted.com",
		});

		let formData = new FormData();
		formData.set("name", "test");

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: { Origin: "https://trusted.com" },
			body: formData,
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("falls back to Referer header for origin check", async () => {
		let [middleware] = createCsrfTokenMiddleware({
			cookie,
			origin: "https://trusted.com",
		});

		let formData = new FormData();
		formData.set("name", "test");

		let request = new Request("https://remix.utils", {
			method: "POST",
			headers: { Referer: "https://trusted.com/page" },
			body: formData,
		});

		let response = await runMiddleware(middleware, { request });
		expect(response.status).toBe(200);
	});

	test("validates token when origin is not trusted", async () => {
		let [middleware, getToken] = createCsrfTokenMiddleware({
			cookie,
			origin: "https://trusted.com",
		});

		let context1 = new RouterContextProvider();
		let request1 = new Request("https://remix.utils", { method: "GET" });
		let response1 = await runMiddleware(middleware, {
			request: request1,
			context: context1,
		});
		let token = getToken(context1);
		let setCookie = response1.headers.get("Set-Cookie");

		let formData = new FormData();
		formData.set("csrf", token);

		let request2 = new Request("https://remix.utils", {
			method: "POST",
			headers: {
				Origin: "https://other.com",
				Cookie: setCookie ?? "",
			},
			body: formData,
		});

		let response2 = await runMiddleware(middleware, { request: request2 });
		expect(response2.status).toBe(200);
	});
});
