import { describe, expect, test } from "bun:test";

import { cors } from "./cors.js";

function createRequest(headers: Headers = new Headers()) {
	headers.set("Origin", "http://remix.utils");
	return new Request("http://remix.utils/test", { method: "OPTIONS", headers });
}

describe(cors, () => {
	test("change the Content-Length to 0 for preflight requests", async () => {
		let request = createRequest();
		let response = new Response("", { status: 204 });
		await cors(request, response);
		expect(response.headers.get("Content-Length")).toBe("0");
	});

	describe("Access-Control-Allow-Origin", () => {
		test("No request origin", async () => {
			let request = new Request("http://remix.utils/test", {
				method: "OPTIONS",
			});
			let response = new Response("", { status: 200 });
			await cors(request, response);
			expect(response.headers.get("Access-Control-Allow-Origin")).toBe(null);
		});

		test("Disallow any origin", async () => {
			let request = createRequest();
			let response = new Response("", { status: 200 });
			await cors(request, response, { origin: false });
			expect(response.headers.get("Access-Control-Allow-Origin")).toBe(null);
		});

		test("Allow any origin", async () => {
			let request = createRequest();
			let response = new Response("", { status: 200 });
			await cors(request, response, { origin: "*" });
			expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		});

		test("Allow specific origin", async () => {
			let request = createRequest();
			let response = new Response("", { status: 200 });

			await cors(request, response, { origin: "http://remix.utils" });

			expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
				"http://remix.utils",
			);
		});

		test("Allow request origin", async () => {
			let request = createRequest();
			let response = new Response("", { status: 200 });
			await cors(request, response, { origin: true });
			expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
				"http://remix.utils",
			);
		});

		test("Use origin function", async () => {
			let request = createRequest();

			let response = new Response("", { status: 200 });

			await cors(request, response, {
				async origin(origin) {
					return origin;
				},
			});

			expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
				"http://remix.utils",
			);
			expect(response.headers.get("Vary")?.includes("Origin")).toBeTruthy();
		});

		test("Use origin function receiving null", async () => {
			let request = new Request("http://remix.utils/test");

			let response = new Response("", { status: 200 });

			await cors(request, response, {
				async origin() {
					return false;
				},
			});

			expect(response.headers.get("Access-Control-Allow-Origin")).toBe(null);
		});

		test("Allow based on RegExp", async () => {
			let request = createRequest();
			let response = new Response("", { status: 200 });
			await cors(request, response, { origin: /^http:\/\/remix.utils/ });
			expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
				"http://remix.utils",
			);
		});

		test("Allow a list of origins", async () => {
			let request = createRequest();
			let response = new Response("", { status: 200 });
			await cors(request, response, { origin: ["http://remix.utils"] });
			expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
				"http://remix.utils",
			);
		});

		test("Allow a list of origins", async () => {
			let request = createRequest();
			let response = new Response("", { status: 200 });
			await cors(request, response, { origin: ["http://localhost:4000"] });
			expect(response.headers.get("Access-Control-Allow-Origin")).toBe(null);
		});
	});

	describe("Access-Control-Allow-Methods", () => {
		test("Allow specific methods", async () => {
			let request = createRequest();

			let response = new Response("", { status: 200 });

			await cors(request, response, {
				methods: ["OPTIONS", "GET"],
			});

			expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
				"OPTIONS,GET",
			);
		});
	});

	describe("Access-Control-Allow-Credentials", () => {
		test("Allow credentials", async () => {
			let request = createRequest();

			let response = new Response("", { status: 200 });

			await cors(request, response, { credentials: true });

			expect(response.headers.get("Access-Control-Allow-Credentials")).toBe(
				"true",
			);
		});
	});

	describe("Access-Control-Allow-Headers", () => {
		test("Allow headers based on request", async () => {
			let request = createRequest(
				new Headers({
					"Access-Control-Request-Headers": "X-Test-Header,X-Test-Header-2",
				}),
			);

			let response = new Response("", { status: 200 });

			await cors(request, response);

			expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
				"X-Test-Header,X-Test-Header-2",
			);
			expect(response.headers.get("Vary")).toBe(
				"Origin, Access-Control-Request-Headers",
			);
		});

		test("Allow only configured headers", async () => {
			let request = createRequest(
				new Headers({
					"X-Test-Header": "test",
					"X-Test-Header-2": "test2",
				}),
			);

			let response = new Response("", { status: 200 });

			await cors(request, response, {
				allowedHeaders: ["X-Test-Header", "X-Test-Header-2"],
			});

			expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
				["X-Test-Header", "X-Test-Header-2"].join(","),
			);
		});
	});

	describe("Access-Control-Expose-Headers", () => {
		test("Don't expose any header", async () => {
			let request = createRequest();
			let response = new Response("", { status: 200 });
			await cors(request, response);
			expect(response.headers.get("Access-Control-Expose-Headers")).toBe(null);
		});

		test("Expose configured headers", async () => {
			let request = createRequest();
			let response = new Response("", { status: 200 });
			await cors(request, response, {
				exposedHeaders: ["X-Test-Header", "X-Test-Header-2"],
			});
			expect(response.headers.get("Access-Control-Expose-Headers")).toBe(
				"X-Test-Header,X-Test-Header-2",
			);
		});
	});

	describe("Access-Control-Max-Age", () => {
		test("Don't set a max allowed age", async () => {
			let request = createRequest();
			let response = new Response("", { status: 200 });
			await cors(request, response);
			expect(response.headers.get("Access-Control-Max-Age")).toBe(null);
		});

		test("Set a max allowed age", async () => {
			let request = createRequest();
			let response = new Response("", { status: 200 });
			await cors(request, response, {
				maxAge: 600,
			});
			expect(response.headers.get("Access-Control-Max-Age")).toBe("600");
		});
	});
});
