import { createCookieSessionStorage } from "remix";
import {
  createAuthenticityToken,
  verifyAuthenticityToken,
} from "../../src/server/csrf";

describe("CSRF Server", () => {
  let sessionStorage = createCookieSessionStorage({
    cookie: { name: "session", secrets: ["s3cr3t"] },
  });

  describe(createAuthenticityToken, () => {
    test("should return a random string", async () => {
      let session = await sessionStorage.getSession();
      const token = createAuthenticityToken(session);
      expect(token).toBeDefined();
      expect(token).toHaveLength(136);
    });

    test("the returned token should be stored in the session as csrf", async () => {
      let session = await sessionStorage.getSession();
      const token = createAuthenticityToken(session);
      expect(session.get("csrf")).toBe(token);
    });

    test("should be able to change the key used to store the token in the session", async () => {
      let session = await sessionStorage.getSession();
      const token = createAuthenticityToken(session, "newKey");
      expect(session.get("newKey")).toBe(token);
    });
  });

  describe(verifyAuthenticityToken, () => {
    test("should throw Unprocessable Entity if the csrf is not in the session", async () => {
      let session = await sessionStorage.getSession();
      let cookie = await sessionStorage.commitSession(session);
      let request = new Request("/", {
        method: "POST",
        headers: { cookie },
      });

      try {
        await verifyAuthenticityToken(request, session);
      } catch (error) {
        if (!(error instanceof Response)) throw error;
        expect(error.status).toBe(422);
        expect(await error.json()).toEqual({
          message: "Can't find CSRF token in session.",
        });
      }
    });

    test("should throw Unprocessable Entity if csrf is not in the body", async () => {
      let session = await sessionStorage.getSession();
      session.set("csrf", "token");
      let cookie = await sessionStorage.commitSession(session);
      let request = new Request("/", {
        method: "POST",
        headers: { cookie },
      });

      try {
        await verifyAuthenticityToken(request, session);
      } catch (error) {
        if (!(error instanceof Response)) throw error;
        expect(error.status).toBe(422);
        expect(await error.json()).toEqual({
          message: "Can't find CSRF token in body.",
        });
      }
    });

    test("should throw Unprocessable Entity if session and body csrf don't match", async () => {
      let session = await sessionStorage.getSession();
      session.set("csrf", "token");
      let cookie = await sessionStorage.commitSession(session);
      let request = new Request("/", {
        method: "POST",
        headers: { cookie },
        body: new URLSearchParams({ csrf: "wrong token" }),
      });

      try {
        await verifyAuthenticityToken(request, session);
      } catch (error) {
        if (!(error instanceof Response)) throw error;
        expect(error.status).toBe(422);
        expect(await error.json()).toEqual({
          message: "Can't verify CSRF token authenticity.",
        });
      }
    });
  });
});
