import { describe, expect, test } from "bun:test";
import { unstable_createSecureHeadersMiddleware } from "./secure-headers.js";
import { runMiddleware } from "./test-helper.js";

describe(unstable_createSecureHeadersMiddleware, () => {
	test("returns a middleware function", () => {
		let [middleware] = unstable_createSecureHeadersMiddleware();
		expect(middleware).toBeFunction();
	});

	test("the middleware should add the default headers", async () => {
		let [middleware] = unstable_createSecureHeadersMiddleware();

		let response = await runMiddleware(middleware);

		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get("X-Frame-Options")).toEqual("SAMEORIGIN");
		expect(response.headers.get("Strict-Transport-Security")).toEqual(
			"max-age=15552000; includeSubDomains",
		);
		expect(response.headers.get("X-Download-Options")).toEqual("noopen");
		expect(response.headers.get("X-XSS-Protection")).toEqual("0");
		expect(response.headers.get("X-Powered-By")).toBeNull();
		expect(response.headers.get("X-DNS-Prefetch-Control")).toEqual("off");
		expect(response.headers.get("X-Content-Type-Options")).toEqual("nosniff");
		expect(response.headers.get("Referrer-Policy")).toEqual("no-referrer");
		expect(response.headers.get("X-Permitted-Cross-Domain-Policies")).toEqual(
			"none",
		);
		expect(response.headers.get("Cross-Origin-Resource-Policy")).toEqual(
			"same-origin",
		);
		expect(response.headers.get("Cross-Origin-Opener-Policy")).toEqual(
			"same-origin",
		);
		expect(response.headers.get("Origin-Agent-Cluster")).toEqual("?1");
		expect(response.headers.get("Permissions-Policy")).toBeNull();
		expect(response.headers.get("Content-Security-Policy")).toBeFalsy();
		expect(
			response.headers.get("Content-Security-Policy-ReportOnly"),
		).toBeFalsy();
	});

	test("all headers enabled", async () => {
		let [middleware] = unstable_createSecureHeadersMiddleware({
			contentSecurityPolicy: {
				defaultSrc: ["'self'"],
			},
			contentSecurityPolicyReportOnly: {
				defaultSrc: ["'self'"],
			},
			crossOriginEmbedderPolicy: true,
			permissionsPolicy: {
				camera: [],
			},
		});

		let response = await runMiddleware(middleware);

		expect(response).not.toBeNull();
		expect(response.status).toBe(200);
		expect(response.headers.get("X-Frame-Options")).toEqual("SAMEORIGIN");
		expect(response.headers.get("Strict-Transport-Security")).toEqual(
			"max-age=15552000; includeSubDomains",
		);
		expect(response.headers.get("X-Download-Options")).toEqual("noopen");
		expect(response.headers.get("X-XSS-Protection")).toEqual("0");
		expect(response.headers.get("X-Powered-By")).toBeNull();
		expect(response.headers.get("X-DNS-Prefetch-Control")).toEqual("off");
		expect(response.headers.get("X-Content-Type-Options")).toEqual("nosniff");
		expect(response.headers.get("Referrer-Policy")).toEqual("no-referrer");
		expect(response.headers.get("X-Permitted-Cross-Domain-Policies")).toEqual(
			"none",
		);
		expect(response.headers.get("Cross-Origin-Resource-Policy")).toEqual(
			"same-origin",
		);
		expect(response.headers.get("Cross-Origin-Opener-Policy")).toEqual(
			"same-origin",
		);
		expect(response.headers.get("Origin-Agent-Cluster")).toEqual("?1");
		expect(response.headers.get("Cross-Origin-Embedder-Policy")).toEqual(
			"require-corp",
		);
		expect(response.headers.get("Permissions-Policy")).toEqual("camera=()");
		expect(response.headers.get("Content-Security-Policy")).toEqual(
			"default-src 'self'",
		);
		expect(response.headers.get("Content-Security-Policy-Report-Only")).toEqual(
			"default-src 'self'",
		);
	});

	test("specific headers disabled", async () => {
		let [middleware] = unstable_createSecureHeadersMiddleware({
			xFrameOptions: false,
			xXssProtection: false,
		});

		let res = await runMiddleware(middleware);

		expect(res.headers.get("X-Frame-Options")).toBeNull();
		expect(res.headers.get("Strict-Transport-Security")).toEqual(
			"max-age=15552000; includeSubDomains",
		);
		expect(res.headers.get("X-Download-Options")).toEqual("noopen");
		expect(res.headers.get("X-XSS-Protection")).toBeNull();
		expect(res.headers.get("X-Powered-By")).toBeNull();
		expect(res.headers.get("X-DNS-Prefetch-Control")).toEqual("off");
		expect(res.headers.get("X-Content-Type-Options")).toEqual("nosniff");
		expect(res.headers.get("Referrer-Policy")).toEqual("no-referrer");
		expect(res.headers.get("X-Permitted-Cross-Domain-Policies")).toEqual(
			"none",
		);
		expect(res.headers.get("Cross-Origin-Resource-Policy")).toEqual(
			"same-origin",
		);
		expect(res.headers.get("Cross-Origin-Opener-Policy")).toEqual(
			"same-origin",
		);
		expect(res.headers.get("Permissions-Policy")).toBeNull();
		expect(res.headers.get("Origin-Agent-Cluster")).toEqual("?1");
	});

	test("should use custom value when overridden", async () => {
		let [middleware] = unstable_createSecureHeadersMiddleware({
			strictTransportSecurity: "max-age=31536000; includeSubDomains; preload;",
			xFrameOptions: "DENY",
			xXssProtection: "1",
		});

		let res = await runMiddleware(middleware);

		expect(res.headers.get("Strict-Transport-Security")).toEqual(
			"max-age=31536000; includeSubDomains; preload;",
		);
		expect(res.headers.get("X-FRAME-OPTIONS")).toEqual("DENY");
		expect(res.headers.get("X-XSS-Protection")).toEqual("1");
	});

	test("should set Permission-Policy header correctly", async () => {
		let [middleware] = unstable_createSecureHeadersMiddleware({
			permissionsPolicy: {
				fullscreen: ["self"],
				bluetooth: ["none"],
				payment: ["self", "example.com"],
				syncXhr: [],
				camera: false,
				microphone: true,
				geolocation: ["*"],
				usb: ["self", "https://a.example.com", "https://b.example.com"],
				accelerometer: ["https://*.example.com"],
				gyroscope: ["src"],
				magnetometer: ["https://a.example.com", "https://b.example.com"],
			},
		});

		let res = await runMiddleware(middleware);

		expect(res.headers.get("Permissions-Policy")).toEqual(
			'fullscreen=(self), bluetooth=none, payment=(self "example.com"), sync-xhr=(), camera=none, microphone=*, ' +
				'geolocation=*, usb=(self "https://a.example.com" "https://b.example.com"), ' +
				'accelerometer=("https://*.example.com"), gyroscope=(src), ' +
				'magnetometer=("https://a.example.com" "https://b.example.com")',
		);
	});

	describe.each([
		{
			cspSettingName: "contentSecurityPolicy",
			cspHeaderName: "Content-Security-Policy",
		},
		{
			cspSettingName: "contentSecurityPolicyReportOnly",
			cspHeaderName: "Content-Security-Policy-Report-Only",
		},
	])("CSP Setting ($cspSettingName)", ({ cspSettingName, cspHeaderName }) => {
		test("CSP Setting", async () => {
			let [middleware] = unstable_createSecureHeadersMiddleware({
				[cspSettingName]: {
					defaultSrc: ["'self'"],
					baseUri: ["'self'"],
					fontSrc: ["'self'", "https:", "data:"],
					frameAncestors: ["'self'"],
					imgSrc: ["'self'", "data:"],
					objectSrc: ["'none'"],
					scriptSrc: ["'self'"],
					scriptSrcAttr: ["'none'"],
					styleSrc: ["'self'", "https:", "'unsafe-inline'"],
				},
			});

			let res = await runMiddleware(middleware);

			expect(res.headers.get(cspHeaderName)).toEqual(
				"default-src 'self'; base-uri 'self'; font-src 'self' https: data:; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self' https: 'unsafe-inline'",
			);
		});

		test("CSP Setting one only", async () => {
			let [middleware] = unstable_createSecureHeadersMiddleware({
				[cspSettingName]: {
					defaultSrc: ["'self'"],
				},
			});

			let res = await runMiddleware(middleware);

			expect(res.headers.get(cspHeaderName)).toEqual("default-src 'self'");
		});

		test("No CSP Setting", async () => {
			let [middleware] = unstable_createSecureHeadersMiddleware({
				[cspSettingName]: {},
			});

			let res = await runMiddleware(middleware);

			expect(res.headers.get(cspHeaderName)).toEqual("");
		});

		test("CSP with reportTo 0", async () => {
			let [middleware] = unstable_createSecureHeadersMiddleware({
				reportingEndpoints: [
					{
						name: "endpoint-1",
						url: "https://example.com/reports",
					},
				],
				[cspSettingName]: {
					defaultSrc: ["'self'"],
					reportTo: "endpoint-1",
				},
			});

			let res = await runMiddleware(middleware);

			expect(res.headers.get("Reporting-Endpoints")).toEqual(
				'endpoint-1="https://example.com/reports"',
			);
			expect(res.headers.get(cspHeaderName)).toEqual(
				"default-src 'self'; report-to endpoint-1",
			);
		});
		test("CSP with reportTo 1", async () => {
			let [middleware] = unstable_createSecureHeadersMiddleware({
				reportTo: [
					{
						group: "endpoint-1",
						max_age: 10886400,
						endpoints: [{ url: "https://example.com/reports" }],
					},
				],
				[cspSettingName]: {
					defaultSrc: ["'self'"],
					reportTo: "endpoint-1",
				},
			});
			let res = await runMiddleware(middleware);

			expect(res.headers.get("Report-To")).toEqual(
				'{"group":"endpoint-1","max_age":10886400,"endpoints":[{"url":"https://example.com/reports"}]}',
			);
			expect(res.headers.get(cspHeaderName)).toEqual(
				"default-src 'self'; report-to endpoint-1",
			);
		});

		test("CSP with reportTo 2", async () => {
			let [middleware] = unstable_createSecureHeadersMiddleware({
				reportTo: [
					{
						group: "g1",
						max_age: 10886400,
						endpoints: [
							{ url: "https://a.example.com/reports" },
							{ url: "https://b.example.com/reports" },
						],
					},
					{
						group: "g2",
						max_age: 10886400,
						endpoints: [
							{ url: "https://c.example.com/reports" },
							{ url: "https://d.example.com/reports" },
						],
					},
				],
				[cspSettingName]: {
					defaultSrc: ["'self'"],
					reportTo: "g2",
				},
			});

			let res = await runMiddleware(middleware);

			expect(res.headers.get("Report-To")).toEqual(
				'{"group":"g1","max_age":10886400,"endpoints":[{"url":"https://a.example.com/reports"},{"url":"https://b.example.com/reports"}]}, {"group":"g2","max_age":10886400,"endpoints":[{"url":"https://c.example.com/reports"},{"url":"https://d.example.com/reports"}]}',
			);
			expect(res.headers.get(cspHeaderName)).toEqual(
				"default-src 'self'; report-to g2",
			);
		});

		test("CSP with reportTo 3", async () => {
			let [middleware] = unstable_createSecureHeadersMiddleware({
				reportingEndpoints: [
					{
						name: "e1",
						url: "https://a.example.com/reports",
					},
					{
						name: "e2",
						url: "https://b.example.com/reports",
					},
				],
				[cspSettingName]: {
					defaultSrc: ["'self'"],
					reportTo: "e1",
				},
			});

			let res = await runMiddleware(middleware);

			expect(res.headers.get("Reporting-Endpoints")).toEqual(
				'e1="https://a.example.com/reports", e2="https://b.example.com/reports"',
			);
			expect(res.headers.get(cspHeaderName)).toEqual(
				"default-src 'self'; report-to e1",
			);
		});
	});
});
