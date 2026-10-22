import { describe, expect, test } from "bun:test";
import { createCookie } from "react-router";
import { CSRF, CSRFError } from "./csrf.js";

describe("CSRF", () => {
	let cookie = createCookie("csrf", { secrets: ["s3cr3t"] });
	let csrf = new CSRF({ cookie });

	test("generates a new authenticity token with the default size", async () => {
		let token = await csrf.generate();
		expect(token).toStrictEqual(expect.any(String));
		expect(token).toHaveLength(32);
	});

	test("generates a new authenticity token with the given size", async () => {
		let token = await csrf.generate(64);
		expect(token).toStrictEqual(expect.any(String));
		expect(token).toHaveLength(64);
	});

	test("generates a new signed authenticity token", async () => {
		let csrf = new CSRF({ cookie, secret: "my-secret" });

		let token = await csrf.generate();
		let [value, signature] = token.split(".");

		expect(token).toHaveLength(76);
		expect(value).toHaveLength(32);
		expect(signature).toHaveLength(43);
	});

	test("verify tokens using FormData and Headers", async () => {
		let token = await csrf.generate();

		let headers = new Headers({
			cookie: await cookie.serialize(token),
		});

		let formData = new FormData();
		formData.set("csrf", token);

		expect(csrf.validate(formData, headers)).resolves.toBeUndefined();
	});

	test("verify tokens using Request", async () => {
		let token = await csrf.generate();

		let headers = new Headers({
			cookie: await cookie.serialize(token),
		});

		let formData = new FormData();
		formData.set("csrf", token);

		let request = new Request("http://remix.utils/", {
			method: "POST",
			headers,
			body: formData,
		});

		expect(csrf.validate(request)).resolves.toBeUndefined();
	});

	test('throws "Can\'t find CSRF token in cookie" if cookie is not set', async () => {
		let headers = new Headers();

		let formData = new FormData();
		formData.set("csrf", "token");

		expect(csrf.validate(formData, headers)).rejects.toThrow(
			new CSRFError("missing_token_in_cookie", "Can't find CSRF token in cookie."),
		);
	});

	test('throw "Invalid CSRF token in cookie" if cookie is not a string', async () => {
		let headers = new Headers({
			cookie: await cookie.serialize(123),
		});

		let formData = new FormData();
		formData.set("csrf", "token");

		expect(csrf.validate(formData, headers)).rejects.toThrow(
			new CSRFError("invalid_token_in_cookie", "Invalid CSRF token in cookie."),
		);
	});

	test('throws "Can\'t find CSRF token in body" if CSRF token is not in body', async () => {
		let token = await csrf.generate();

		let headers = new Headers({
			cookie: await cookie.serialize(token),
		});

		let formData = new FormData();

		expect(csrf.validate(formData, headers)).rejects.toThrow(
			new CSRFError("missing_token_in_body", "Can't find CSRF token in body."),
		);
	});

	test("throws \"Can't verify CSRF token authenticity\" if CSRF token in body doesn't match CSRF token in cookie", async () => {
		let token = await csrf.generate();

		let headers = new Headers({
			cookie: await cookie.serialize(token),
		});

		let formData = new FormData();
		formData.set("csrf", "wrong token");

		expect(csrf.validate(formData, headers)).rejects.toThrow(
			new CSRFError("mismatched_token", "Can't verify CSRF token authenticity."),
		);
	});

	test('throws "Tampered CSRF token in cookie" if the CSRF token in cookie is changed', async () => {
		let securetCSRF = new CSRF({ cookie, secret: "my-secret" });

		let token = await securetCSRF.generate();

		let formData = new FormData();
		formData.set("csrf", token);

		let headers = new Headers({
			cookie: await cookie.serialize([await csrf.generate(), token.split(".").at(1)].join(".")),
		});

		expect(securetCSRF.validate(formData, headers)).rejects.toThrow(
			new CSRFError("tampered_token_in_cookie", "Tampered CSRF token in cookie."),
		);
	});

	test("rejects CSRF tokens signed with a different secret", async () => {
		let token = await new CSRF({ cookie, secret: "my-secret" }).generate();

		let formData = new FormData();
		formData.set("csrf", token);

		let headers = new Headers({
			cookie: await cookie.serialize(token),
		});

		expect(
			new CSRF({ cookie, secret: "different-secret" }).validate(formData, headers),
		).rejects.toThrow(new CSRFError("tampered_token_in_cookie", "Tampered CSRF token in cookie."));
	});

	test("accepts legacy Oslo-padded base64url signatures", async () => {
		let secureCSRF = new CSRF({ cookie, secret: "my-secret" });
		let token = await secureCSRF.generate();
		let [value, signature] = token.split(".");
		let paddedToken = `${value}.${signature}=`;

		let formData = new FormData();
		formData.set("csrf", paddedToken);

		let headers = new Headers({
			cookie: await cookie.serialize(paddedToken),
		});

		await expect(secureCSRF.validate(formData, headers)).resolves.toBeUndefined();
	});

	test("commits the token to a cookie", async () => {
		let [token, cookieHeader] = await csrf.commitToken();
		let parsedCookie = await cookie.parse(cookieHeader);

		expect(token).toStrictEqual(expect.any(String));
		expect(cookieHeader).toStrictEqual(expect.any(String));
		expect(token).toEqual(parsedCookie);
	});

	test("does not return a cookie header if there's already a value", async () => {
		let originalToken = await csrf.generate();
		let headers = new Headers({
			cookie: await cookie.serialize(originalToken),
		});
		let [token, cookieHeader] = await csrf.commitToken(headers);
		expect(token).toBe(originalToken);
		expect(cookieHeader).toBe(null);
	});
});
