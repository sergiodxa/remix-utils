import { describe, expect, test } from "bun:test";
import { respondTo } from "./respond-to.js";

describe(respondTo, () => {
	test("uses default handler", () => {
		let headers = new Headers({ accept: "text/html" });

		let response = new Response("default");

		expect(
			respondTo(headers, {
				default() {
					return response;
				},
			}),
		).toEqual(response);
	});

	test("uses default handler when no accept header", () => {
		let response = new Response("default");

		expect(
			respondTo(new Headers(), {
				default() {
					return response;
				},
			}),
		).toEqual(response);
	});

	test("uses default handler when no handlers match", () => {
		let headers = new Headers({ accept: "text/html" });

		let response = new Response("default");

		expect(
			respondTo(headers, {
				"application/json"() {
					return new Response("json");
				},
				default() {
					return response;
				},
			}),
		).toEqual(response);
	});

	test("uses handler for exact match", () => {
		let headers = new Headers({ accept: "text/html" });

		let response = new Response("text/html");

		expect(
			respondTo(headers, {
				"text/html"() {
					return response;
				},
				default() {
					return new Response("default");
				},
			}),
		).toEqual(response);
	});

	test("uses handler for exact match with params", () => {
		let headers = new Headers({ accept: "text/html; charset=utf-8" });

		let response = new Response("text/html");

		expect(
			respondTo(headers, {
				"text/html"() {
					return response;
				},
				default() {
					return new Response("default");
				},
			}),
		).toEqual(response);
	});

	test("uses handler for exact match with params and whitespace", () => {
		let headers = new Headers({ accept: "text/html ; charset=utf-8" });

		let response = new Response("text/html");

		expect(
			respondTo(headers, {
				"text/html"() {
					return response;
				},
				default() {
					return new Response("default");
				},
			}),
		).toEqual(response);
	});

	test("uses handler for subtype", () => {
		let headers = new Headers({ accept: "text/html" });

		let response = new Response("text/html");

		expect(
			respondTo(headers, {
				html() {
					return response;
				},
				default() {
					return new Response("default");
				},
			}),
		).toEqual(response);
	});

	test("uses handler for type", () => {
		let headers = new Headers({ accept: "text/html" });

		let response = new Response("text/html");

		expect(
			respondTo(headers, {
				text() {
					return response;
				},
				default() {
					return new Response("default");
				},
			}),
		).toEqual(response);
	});

	test("returns promises", async () => {
		let headers = new Headers({ accept: "text/html" });

		let response = new Response("text/html");

		expect(
			respondTo(headers, {
				async text() {
					return response;
				},
				default() {
					return new Response("default");
				},
			}),
		).resolves.toEqual(response);
	});
});
