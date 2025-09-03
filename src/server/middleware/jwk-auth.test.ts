import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { JWK, JWT } from "@edgefirst-dev/jwt";
import { MemoryFileStorage } from "@remix-run/file-storage/memory";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/native";
import { createCookie, unstable_RouterContextProvider } from "react-router";
import { unstable_createJWKAuthMiddleware } from "./jwk-auth.js";
import { catchResponse, runMiddleware } from "./test-helper.js";

const storage = new MemoryFileStorage();
const signingKeys = await JWK.signingKeys(storage);
const server = setupServer(
	http.get(
		new URL("https://remix.utils/.well-known/jwks.json").toString(),
		() => HttpResponse.json(JWK.toJSON(signingKeys)),
	),
);

describe(unstable_createJWKAuthMiddleware, () => {
	beforeAll(() => server.listen());
	afterAll(() => server.close());

	test("sets the JWT payload into context when the token comes from the header", async () => {
		let jwt = new JWT({
			sub: "test",
			iss: "idp.remix.utils",
			aud: "api.remix.utils",
		});

		let token = await jwt.sign(JWK.Algoritm.ES256, signingKeys);

		let [middleware, getJWTPayload] = unstable_createJWKAuthMiddleware({
			jwksUri: "https://remix.utils/.well-known/jwks.json",
			verifyOptions: {
				issuer: "idp.remix.utils",
				audience: "api.remix.utils",
			},
		});

		let request = new Request("https://remix.utils", {
			headers: { Authorization: `Bearer ${token}` },
		});

		let context = new unstable_RouterContextProvider();

		await runMiddleware(middleware, { request, context });

		expect(getJWTPayload(context)).toEqual(jwt);
	});

	test("sets the JWT payload into context when the token comes from the cookie", async () => {
		let jwt = new JWT({
			sub: "test",
			iss: "idp.remix.utils",
			aud: "api.remix.utils",
		});

		let token = await jwt.sign(JWK.Algoritm.ES256, signingKeys);

		let cookie = createCookie("token", { path: "/" });

		let [middleware, getJWTPayload] = unstable_createJWKAuthMiddleware({
			jwksUri: "https://remix.utils/.well-known/jwks.json",
			verifyOptions: {
				issuer: "idp.remix.utils",
				audience: "api.remix.utils",
			},
			cookie,
		});

		let request = new Request("https://remix.utils", {
			headers: { Cookie: await cookie.serialize(token) },
		});

		let context = new unstable_RouterContextProvider();

		await runMiddleware(middleware, { request, context });

		expect(getJWTPayload(context)).toEqual(jwt);
	});

	test("throw an error if there's no token in the cookie", async () => {
		let cookie = createCookie("token", { path: "/" });

		let [middleware] = unstable_createJWKAuthMiddleware({
			jwksUri: "https://remix.utils/.well-known/jwks.json",
			verifyOptions: {
				issuer: "idp.remix.utils",
				audience: "api.remix.utils",
			},
			cookie,
		});

		let request = new Request("https://remix.utils", {
			headers: { Cookie: await cookie.serialize(null) },
		});

		let response = await catchResponse(runMiddleware(middleware, { request }));

		expect(response.status).toBe(401);
		expect(response.statusText).toBe("Unauthorized");
		expect(response.headers.get("WWW-Authenticate")).toBe(
			'Bearer realm="Secure Area"',
		);
		expect(response.text()).resolves.toBe(JSON.stringify("Unauthorized"));
	});

	test("throw an error if there's no Authorization header", async () => {
		let [middleware] = unstable_createJWKAuthMiddleware({
			jwksUri: "https://remix.utils/.well-known/jwks.json",
			verifyOptions: {
				issuer: "idp.remix.utils",
				audience: "api.remix.utils",
			},
		});

		let request = new Request("https://remix.utils");

		let response = await catchResponse(runMiddleware(middleware, { request }));

		expect(response.status).toBe(401);
		expect(response.statusText).toBe("Unauthorized");
		expect(response.headers.get("WWW-Authenticate")).toBe(
			'Bearer realm="Secure Area"',
		);
		expect(response.text()).resolves.toBe(JSON.stringify("Unauthorized"));
	});

	test("throws an error if token type is not Bearer in header", async () => {
		let [middleware] = unstable_createJWKAuthMiddleware({
			jwksUri: "https://remix.utils/.well-known/jwks.json",
			verifyOptions: {
				issuer: "idp.remix.utils",
				audience: "api.remix.utils",
			},
		});

		let request = new Request("https://remix.utils", {
			headers: {
				Authorization: `Basic ${Buffer.from("username:password").toString(
					"base64",
				)}`,
			},
		});

		let response = await catchResponse(runMiddleware(middleware, { request }));

		expect(response.status).toBe(401);
		expect(response.statusText).toBe("Unauthorized");
		expect(response.headers.get("WWW-Authenticate")).toBe(
			'Bearer realm="Secure Area"',
		);
		expect(response.text()).resolves.toBe(JSON.stringify("Unauthorized"));
	});

	test("throws an error if there's no token in the Authorization header", async () => {
		let [middleware] = unstable_createJWKAuthMiddleware({
			jwksUri: "https://remix.utils/.well-known/jwks.json",
			verifyOptions: {
				issuer: "idp.remix.utils",
				audience: "api.remix.utils",
			},
		});

		let request = new Request("https://remix.utils", {
			headers: { Authorization: "Bearer" },
		});

		let response = await catchResponse(runMiddleware(middleware, { request }));

		expect(response.status).toBe(401);
		expect(response.statusText).toBe("Unauthorized");
		expect(response.headers.get("WWW-Authenticate")).toBe(
			'Bearer realm="Secure Area"',
		);
		expect(response.text()).resolves.toBe(JSON.stringify("Unauthorized"));
	});

	test("throws an error if the token is invalid", async () => {
		let [middleware] = unstable_createJWKAuthMiddleware({
			jwksUri: "https://remix.utils/.well-known/jwks.json",
			verifyOptions: {
				issuer: "idp.remix.utils",
				audience: "api.remix.utils",
			},
		});

		let request = new Request("https://remix.utils", {
			headers: { Authorization: "Bearer invalid-token" },
		});

		let response = await catchResponse(runMiddleware(middleware, { request }));

		expect(response.status).toBe(401);
		expect(response.statusText).toBe("Unauthorized");
		expect(response.headers.get("WWW-Authenticate")).toBe(
			'Bearer realm="Secure Area"',
		);
		expect(response.text()).resolves.toBe(JSON.stringify("Unauthorized"));
	});
});
