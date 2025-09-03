import { describe, expect, mock, test } from "bun:test";
import { redirect } from "react-router";
import { unstable_createHoneypotMiddleware } from "./honeypot.js";
import { runMiddleware } from "./test-helper.js";

describe(unstable_createHoneypotMiddleware, () => {
	test("can get the Honeypot input props", async () => {
		let [, getInputProps] = unstable_createHoneypotMiddleware();
		let props = await getInputProps();

		expect(props).toEqual({
			nameFieldName: "name__confirm",
			validFromFieldName: "from__confirm",
			encryptedValidFrom: expect.any(String),
		});
	});

	test("if the request has no body the middleware does nothing", async () => {
		let [middleware] = unstable_createHoneypotMiddleware();

		let request = new Request("https://remix.utils");

		let response = await runMiddleware(middleware, {
			request,
			async next() {
				return Response.json(null);
			},
		});

		expect(response.json()).resolves.toBeNull();
	});

	test("if the request is not a form submission the middleware does nothing", async () => {
		let [middleware] = unstable_createHoneypotMiddleware();
		let request = new Request("https://remix.utils", {
			method: "POST",
			body: JSON.stringify({}),
			headers: { "Content-Type": "application/json" },
		});
		let response = await runMiddleware(middleware, {
			request,
			async next() {
				return Response.json(null);
			},
		});

		expect(response.json()).resolves.toBeNull();
	});

	test("if the request is x-www-form-urlencoded the spam check runs", async () => {
		let [middleware, getInputProps] = unstable_createHoneypotMiddleware();
		let inputProps = await getInputProps();

		let body = new URLSearchParams();
		body.set(inputProps.nameFieldName, "");
		if (inputProps.validFromFieldName) {
			body.set(inputProps.validFromFieldName, inputProps.encryptedValidFrom);
		}

		let request = new Request("https://remix.utils", {
			method: "POST",
			body,
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
		});

		let response = await runMiddleware(middleware, {
			request,
			async next() {
				return Response.json(null);
			},
		});

		expect(response.json()).resolves.toBeNull();
	});

	test("if the request is multipart/form-data the spam check runs", async () => {
		let [middleware, getInputProps] = unstable_createHoneypotMiddleware();
		let inputProps = await getInputProps();

		let body = new FormData();
		body.set(inputProps.nameFieldName, "");
		if (inputProps.validFromFieldName) {
			body.set(inputProps.validFromFieldName, inputProps.encryptedValidFrom);
		}

		let request = new Request("https://remix.utils", { method: "POST", body });

		let response = await runMiddleware(middleware, {
			request,
			async next() {
				return Response.json(null);
			},
		});

		expect(response.json()).resolves.toBeNull();
	});

	test("if the request is spam the middleware runs the onSpam helper", async () => {
		let onSpam = mock().mockImplementation(() => redirect("/"));
		let next = mock().mockImplementation(() => Response.json(null));

		let [middleware, getInputProps] = unstable_createHoneypotMiddleware({
			onSpam,
		});

		let inputProps = await getInputProps();

		let body = new URLSearchParams();
		body.set(inputProps.nameFieldName, "spam");
		if (inputProps.validFromFieldName) {
			body.set(inputProps.validFromFieldName, inputProps.encryptedValidFrom);
		}

		let request = new Request("https://remix.utils", {
			method: "POST",
			body,
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
		});
		let response = await runMiddleware(middleware, { request, next });

		expect(response).toEqual(redirect("/"));
		expect(onSpam).toHaveBeenCalledTimes(1);
		expect(next).not.toHaveBeenCalled();
	});
});
