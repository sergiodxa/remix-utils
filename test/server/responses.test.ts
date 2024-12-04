import { describe, expect, test } from "bun:test";
import {
	ImageType,
	html,
	image,
	javascript,
	notModified,
	pdf,
	stylesheet,
	txt,
	xml,
} from "../../src/server/responses";

let jsonContentType = "application/json; charset=utf-8";

describe("Responses", () => {
	describe(notModified.name, () => {
		test("Should return Response with status 304", async () => {
			let response = notModified();
			expect(response.text()).resolves.toBe("");
			expect(response.status).toBe(304);
		});

		test("Should allow changing the Response headers", async () => {
			let response = notModified({
				headers: { "X-Test": "it worked" },
			});
			expect(response.text()).resolves.toBe("");
			expect(response.status).toBe(304);
			expect(response.headers.get("X-Test")).toBe("it worked");
		});
	});

	describe(javascript.name, () => {
		let content = "console.log('hello world');";
		test("Should return Response with status 200", async () => {
			let response = javascript(content);
			expect(response.text()).resolves.toBe(content);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe(
				"application/javascript; charset=utf-8",
			);
		});

		test("Should allow defining the status as second options", async () => {
			let response = javascript(content, 201);
			expect(response.text()).resolves.toBe(content);
			expect(response.status).toBe(201);
			expect(response.headers.get("Content-Type")).toBe(
				"application/javascript; charset=utf-8",
			);
		});

		test("Should allow changing the Response headers", async () => {
			let response = javascript(content, {
				headers: { "X-Test": "it worked" },
			});
			expect(response.text()).resolves.toBe(content);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe(
				"application/javascript; charset=utf-8",
			);
			expect(response.headers.get("X-Test")).toBe("it worked");
		});
	});

	describe(stylesheet.name, () => {
		let content = "body { color: red; }";
		test("Should return Response with status 200", async () => {
			let response = stylesheet(content);
			expect(response.text()).resolves.toBe(content);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe(
				"text/css; charset=utf-8",
			);
		});

		test("Should allow defining the status as second options", async () => {
			let response = stylesheet(content, 201);
			expect(response.text()).resolves.toBe(content);
			expect(response.status).toBe(201);
			expect(response.headers.get("Content-Type")).toBe(
				"text/css; charset=utf-8",
			);
		});

		test("Should allow changing the Response headers", async () => {
			let response = stylesheet(content, {
				headers: { "X-Test": "it worked" },
			});
			expect(response.text()).resolves.toBe(content);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe(
				"text/css; charset=utf-8",
			);
			expect(response.headers.get("X-Test")).toBe("it worked");
		});
	});

	describe(pdf.name, () => {
		test("Should return Response with status 200", async () => {
			let blob = new Blob();
			let response = pdf(blob);
			expect(response.status).toBe(200);
			expect(response.headers.get("content-type")).toBe("application/pdf");
		});

		test("Should allow defining the status as second options", async () => {
			let blob = new Blob();
			let response = pdf(blob, 201);
			expect(response.status).toBe(201);
			expect(response.headers.get("content-type")).toBe("application/pdf");
		});

		test("Should allow changing the Response headers", async () => {
			let blob = new Blob();
			let response = pdf(blob, {
				headers: { "X-Test": "it worked" },
			});
			expect(response.headers.get("x-test")).toBe("it worked");
			expect(response.status).toBe(200);
			expect(response.headers.get("content-type")).toBe("application/pdf");
		});
	});

	describe(html.name, () => {
		let content = "<h1>Hello World</h1>";
		test("Should return Response with status 200", async () => {
			let response = html(content);
			expect(response.text()).resolves.toBe(content);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe(
				"text/html; charset=utf-8",
			);
		});

		test("Should allow defining the status as second options", async () => {
			let response = html(content, 201);
			expect(response.text()).resolves.toBe(content);
			expect(response.status).toBe(201);
			expect(response.headers.get("Content-Type")).toBe(
				"text/html; charset=utf-8",
			);
		});

		test("Should allow changing the Response headers", async () => {
			let response = html(content, {
				headers: { "X-Test": "it worked" },
			});
			expect(response.text()).resolves.toBe(content);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe(
				"text/html; charset=utf-8",
			);
			expect(response.headers.get("X-Test")).toBe("it worked");
		});
	});

	describe(xml.name, () => {
		let content = "<?xml version='1.0'?><catalog></catalog>";
		test("Should return Response with status 200", async () => {
			let response = xml(content);
			expect(response.text()).resolves.toBe(content);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe(
				"application/xml; charset=utf-8",
			);
		});

		test("Should allow defining the status as second options", async () => {
			let response = xml(content, 201);
			expect(response.text()).resolves.toBe(content);
			expect(response.status).toBe(201);
			expect(response.headers.get("Content-Type")).toBe(
				"application/xml; charset=utf-8",
			);
		});

		test("Should allow changing the Response headers", async () => {
			let response = xml(content, {
				headers: { "X-Test": "it worked" },
			});
			expect(response.text()).resolves.toBe(content);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe(
				"application/xml; charset=utf-8",
			);
			expect(response.headers.get("X-Test")).toBe("it worked");
		});
	});

	describe(txt.name, () => {
		let content = `
      User-agent: *
      Allow: /
    `;
		test("Should return Response with status 200", async () => {
			let response = txt(content);
			expect(response.text()).resolves.toBe(content);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe(
				"text/plain; charset=utf-8",
			);
		});

		test("Should allow defining the status as second options", async () => {
			let response = txt(content, 201);
			expect(response.text()).resolves.toBe(content);
			expect(response.status).toBe(201);
			expect(response.headers.get("Content-Type")).toBe(
				"text/plain; charset=utf-8",
			);
		});

		test("Should allow changing the Response headers", async () => {
			let response = txt(content, {
				headers: { "X-Test": "it worked" },
			});
			expect(response.text()).resolves.toBe(content);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe(
				"text/plain; charset=utf-8",
			);
			expect(response.headers.get("X-Test")).toBe("it worked");
		});
	});

	describe(image.name, () => {
		let content = new ArrayBuffer(0);
		test.each([
			"image/webp",
			"image/bmp",
			"image/avif",
			"image/svg+xml",
			"image/png",
			"image/jpeg",
			"image/gif",
		] as ImageType[])("%s", async (type) => {
			let response = image(content, { type });
			expect(response.arrayBuffer()).resolves.toEqual(content);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe(type);
		});
	});
});
