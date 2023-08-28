import { describe, test, expect } from "vitest";
import { createCookie } from "@remix-run/node";
import { CSRF, CSRFError } from "../../src/server/csrf";

describe("CSRF", () => {
  let cookie = createCookie("csrf", { secrets: ["s3cr3t"] });
  let csrf = new CSRF({ cookie });

  test("generates a new authenticity token with the default size", () => {
    let token = csrf.generate();
    expect(token).toStrictEqual(expect.any(String));
    expect(token).toHaveLength(43);
  });

  test("generates a new authenticity token with the given size", () => {
    let token = csrf.generate(64);
    expect(token).toStrictEqual(expect.any(String));
    expect(token).toHaveLength(86);
  });

  test("generates a new signed authenticity token", () => {
    let csrf = new CSRF({ cookie, secret: "my-secret" });

    let token = csrf.generate();
    let [value, signature] = token.split(".");

    expect(token).toHaveLength(87);
    expect(value).toHaveLength(43);
    expect(signature).toHaveLength(43);
  });

  test("verify tokens using FormData and Headers", async () => {
    let token = csrf.generate();

    let headers = new Headers({
      cookie: await cookie.serialize(token),
    });

    let formData = new FormData();
    formData.set("csrf", token);

    await expect(csrf.validate(formData, headers)).resolves.toBeUndefined();
  });

  test("verify tokens using Request", async () => {
    let token = csrf.generate();

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

    await expect(csrf.validate(request)).resolves.toBeUndefined();
  });

  test('throws "Can\'t find CSRF token in cookie" if cookie is not set', async () => {
    let headers = new Headers();

    let formData = new FormData();
    formData.set("csrf", "token");

    await expect(csrf.validate(formData, headers)).rejects.toThrow(
      new CSRFError(
        "missing_token_in_cookie",
        "Can't find CSRF token in cookie.",
      ),
    );
  });

  test('throw "Invalid CSRF token in cookie" if cookie is not a string', async () => {
    let headers = new Headers({
      cookie: await cookie.serialize(123),
    });

    let formData = new FormData();
    formData.set("csrf", "token");

    await expect(csrf.validate(formData, headers)).rejects.toThrow(
      new CSRFError("invalid_token_in_cookie", "Invalid CSRF token in cookie."),
    );
  });

  test('throws "Can\'t find CSRF token in body" if CSRF token is not in body', async () => {
    let token = csrf.generate();

    let headers = new Headers({
      cookie: await cookie.serialize(token),
    });

    let formData = new FormData();

    await expect(csrf.validate(formData, headers)).rejects.toThrow(
      new CSRFError("missing_token_in_body", "Can't find CSRF token in body."),
    );
  });

  test("throws \"Can't verify CSRF token authenticity\" if CSRF token in body doesn't match CSRF token in cookie", async () => {
    let token = csrf.generate();

    let headers = new Headers({
      cookie: await cookie.serialize(token),
    });

    let formData = new FormData();
    formData.set("csrf", "wrong token");

    await expect(csrf.validate(formData, headers)).rejects.toThrow(
      new CSRFError(
        "mismatched_token",
        "Can't verify CSRF token authenticity.",
      ),
    );
  });

  test('throws "Tampered CSRF token in cookie" if the CSRF token in cookie is changed', async () => {
    let securetCSRF = new CSRF({ cookie, secret: "my-secret" });

    let token = securetCSRF.generate();

    let formData = new FormData();
    formData.set("csrf", token);

    let headers = new Headers({
      cookie: await cookie.serialize(
        [csrf.generate(), token.split(".").at(1)].join("."),
      ),
    });

    await expect(securetCSRF.validate(formData, headers)).rejects.toThrow(
      new CSRFError(
        "tampered_token_in_cookie",
        "Tampered CSRF token in cookie.",
      ),
    );
  });

  test("commits the token to a cookie", async () => {
    let [token, cookieHeader] = await csrf.commitToken();
    let parsedCookie = await cookie.parse(cookieHeader);

    expect(token).toStrictEqual(expect.any(String));
    expect(cookieHeader).toStrictEqual(expect.any(String));
    expect(token).toEqual(parsedCookie);
  });
});
