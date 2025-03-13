import { describe, expect, mock, test } from "bun:test";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64 } from "@oslojs/encoding";
import { unstable_RouterContextProvider } from "react-router";
import { unstable_createBasicAuthMiddleware } from "./basic-auth";
import { catchResponse, runMiddleware } from "./test-helper";

describe(unstable_createBasicAuthMiddleware.name, () => {
	const username = "test";
	const password = "password";

	const encoder = new TextEncoder();
	const credentials = encodeBase64(encoder.encode(`${username}:${password}`));

	const invalidCredentials = encodeBase64(encoder.encode("invalid:invalid"));

	const authorizedRequest = new Request("https://remix.utils", {
		headers: { Authorization: `Basic ${credentials}` },
	});

	const invalidRequest = new Request("https://remix.utils", {
		headers: { Authorization: `Basic ${invalidCredentials}` },
	});

	const unauthorizedRequest = new Request("https://remix.utils");

	test("throws an error if no options are provided", async () => {
		// @ts-expect-error
		expect(() => unstable_createBasicAuthMiddleware({})).toThrowError(
			'unstable_createBasicAuthMiddleware requires options for "username and password" or "verifyUser"',
		);
	});

	test("throws a response if no authorization is provided", async () => {
		let [middleware] = unstable_createBasicAuthMiddleware({
			user: { username, password },
		});

		let response = await catchResponse(
			runMiddleware(middleware, { request: unauthorizedRequest }),
		);

		expect(response.status).toBe(401);
		expect(response.statusText).toBe("Unauthorized");
		expect(response.headers.get("WWW-Authenticate")).toBe(
			'Basic realm="Secure Area"',
		);
	});

	test("the Realm is customizable", async () => {
		let [middleware] = unstable_createBasicAuthMiddleware({
			user: { username, password },
			realm: "Custom Realm",
		});

		let response = await catchResponse(
			runMiddleware(middleware, { request: unauthorizedRequest }),
		);

		expect(response.status).toBe(401);
		expect(response.headers.get("WWW-Authenticate")).toBe(
			'Basic realm="Custom Realm"',
		);
	});

	test("the response body is customizable", async () => {
		let [middleware] = unstable_createBasicAuthMiddleware({
			user: { username, password },
			invalidUserMessage: "Custom Message",
		});

		let response = await catchResponse(
			runMiddleware(middleware, { request: unauthorizedRequest }),
		);

		expect(response.json()).resolves.toEqual("Custom Message");
	});

	test("the response body can be an object", async () => {
		let [middleware] = unstable_createBasicAuthMiddleware({
			user: { username, password },
			invalidUserMessage: { message: "Custom Message" },
		});

		let response = await catchResponse(
			runMiddleware(middleware, { request: unauthorizedRequest }),
		);

		expect(response.json()).resolves.toEqual({ message: "Custom Message" });
	});

	test("the response body can be customized with a function", async () => {
		let invalidUserMessage =
			mock<unstable_createBasicAuthMiddleware.MessageFunction>().mockImplementation(
				({ request }) => {
					return `Custom Message: ${request.url}`;
				},
			);

		let [middleware] = unstable_createBasicAuthMiddleware({
			user: { username, password },
			invalidUserMessage,
		});

		let context = new unstable_RouterContextProvider();

		let response = await catchResponse(
			runMiddleware(middleware, { request: unauthorizedRequest, context }),
		);

		expect(invalidUserMessage).toHaveBeenCalledWith({
			request: unauthorizedRequest,
			context,
		});

		expect(response.json()).resolves.toEqual(
			"Custom Message: https://remix.utils/",
		);
	});

	test("creates a basic auth middleware with username and password", async () => {
		let [middleware, getUser] = unstable_createBasicAuthMiddleware({
			user: { username, password },
		});

		let context = new unstable_RouterContextProvider();

		await runMiddleware(middleware, { request: authorizedRequest, context });

		expect(getUser(context)).toBe(username);
	});

	test("creates a basic auth middleware with verifyUser", async () => {
		let verifyUser = mock().mockResolvedValue(true);

		let [middleware, getUser] = unstable_createBasicAuthMiddleware({
			verifyUser,
		});

		let context = new unstable_RouterContextProvider();

		await runMiddleware(middleware, { context, request: authorizedRequest });

		expect(verifyUser).toHaveBeenCalledWith(username, password, {
			request: authorizedRequest,
			context,
		});

		expect(getUser(context)).toBe(username);
	});

	test("creates a basic auth middleware with invalid user", async () => {
		let verifyUser = mock().mockResolvedValue(false);

		let [middleware] = unstable_createBasicAuthMiddleware({
			verifyUser,
		});

		let context = new unstable_RouterContextProvider();

		let response = await catchResponse(
			runMiddleware(middleware, {
				request: invalidRequest,
				context,
			}),
		);

		expect(verifyUser).toHaveBeenCalledWith("invalid", "invalid", {
			request: authorizedRequest,
			context,
		});

		expect(response.status).toBe(401);
		expect(response.headers.get("WWW-Authenticate")).toBe(
			'Basic realm="Secure Area"',
		);
	});

	test("create a basic auth middleware with a list of users", async () => {
		let [middleware, getUser] = unstable_createBasicAuthMiddleware({
			user: [
				{ username: "test2", password: "password2" },
				{ username, password },
			],
		});

		let context = new unstable_RouterContextProvider();

		await runMiddleware(middleware, {
			request: authorizedRequest,
			context,
		});

		expect(getUser(context)).toBe(username);
	});

	test("create a basic auth middleware with a list of users and invalid user", async () => {
		let [middleware] = unstable_createBasicAuthMiddleware({
			user: [
				{ username: "test2", password: "password2" },
				{ username, password },
			],
		});

		let context = new unstable_RouterContextProvider();

		let response = await catchResponse(
			runMiddleware(middleware, {
				request: invalidRequest,
				context,
			}),
		);

		expect(response.status).toBe(401);
		expect(response.headers.get("WWW-Authenticate")).toBe(
			'Basic realm="Secure Area"',
		);
	});

	test("allows customizing the HashFunction", async () => {
		let hashFunction =
			mock<unstable_createBasicAuthMiddleware.HashFunction>().mockImplementation(
				sha256,
			);

		let [middleware] = unstable_createBasicAuthMiddleware({
			user: { username, password },
			hashFunction,
		});

		await runMiddleware(middleware, { request: authorizedRequest });

		expect(hashFunction).toHaveBeenCalledTimes(4);
	});
});
