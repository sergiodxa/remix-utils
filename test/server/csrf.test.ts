import { createCookieSessionStorage, unstable_parseMultipartFormData, UploadHandler } from "@remix-run/node";
import { createAuthenticityToken, verifyAuthenticityToken } from "../../src/";

describe("CSRF Server", () => {
  let sessionStorage = createCookieSessionStorage({
    cookie: { name: "session", secrets: ["s3cr3t"] },
  });

  describe(createAuthenticityToken, () => {
    test("should return a random string", async () => {
      let session = await sessionStorage.getSession();
      const token = createAuthenticityToken(session);
      expect(token).toBeDefined();
      expect(token).toHaveLength(36);
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
        body: new FormData(),
      });

      try {
        await verifyAuthenticityToken(request, session);
      } catch (error) {
        if (!(error instanceof Response)) throw error;
        expect(error.status).toBe(422);
        expect(await error.json()).toEqual(
          JSON.stringify({
            message: "Can't find CSRF token in session.",
          })
        );
      }
    });

    test("should throw Unprocessable Entity if csrf is not in the body", async () => {
      let session = await sessionStorage.getSession();
      session.set("csrf", "token");

      let cookie = await sessionStorage.commitSession(session);

      let request = new Request("/", {
        method: "POST",
        headers: { cookie },
        body: new FormData(),
      });

      try {
        await verifyAuthenticityToken(request, session);
      } catch (error) {
        if (!(error instanceof Response)) throw error;
        expect(error.status).toBe(422);
        expect(await error.json()).toEqual(
          JSON.stringify({
            message: "Can't find CSRF token in body.",
          })
        );
      }
    });

    test("should throw Unprocessable Entity if session and body csrf don't match", async () => {
      let session = await sessionStorage.getSession();
      session.set("csrf", "token");

      let cookie = await sessionStorage.commitSession(session);

      let formData = new FormData();
      formData.set("csrf", "wrong token");

      let request = new Request("/", {
        method: "POST",
        headers: { cookie },
        body: formData,
      });

      try {
        await verifyAuthenticityToken(request, session);
      } catch (error) {
        if (!(error instanceof Response)) throw error;
        expect(error.status).toBe(422);
        expect(await error.json()).toEqual(
          JSON.stringify({
            message: "Can't verify CSRF token authenticity.",
          })
        );
      }
    });

    test.each([
      [undefined, "csrf"],
      ["xsrf", "xsrf"],
    ])("should validate request if session and body csrf match", async (sessionKey, expected) => {
      let session = await sessionStorage.getSession();
      session.set(expected, "token");

      let cookie = await sessionStorage.commitSession(session);

      let formData = new FormData();
      formData.set(expected, "token");

      let request = new Request("/", {
        method: "POST",
        headers: { cookie },
        body: formData,
      });

      await verifyAuthenticityToken(request, session, sessionKey);
    });

    afterEach(() => jest.restoreAllMocks());

    test("should validate request with File if session and body csrf match", async () => {
      jest.spyOn(console, 'warn');
      const uploadHandler = <UploadHandler>(part => Promise.resolve(`${part.filename} contents`));

      let session = await sessionStorage.getSession();
      session.set("csrf", "token");

      let cookie = await sessionStorage.commitSession(session);

      let formData = new FormData();
      formData.set("csrf", "token");
      formData.set("upload", new Blob(["blob"]), "blob.ext");

      let request = new Request("/", {
        method: "POST",
        headers: { cookie },
        body: formData,
      });

      await verifyAuthenticityToken(
        await unstable_parseMultipartFormData(request, uploadHandler),
        session);

      // Tried to parse multipart file upload for field "upload" but no uploadHandler was provided.
      // Read more here: https://remix.run/api/remix#parseMultipartFormData-node
      expect(console.warn).toHaveBeenCalledTimes(0);
    });
  });
});
