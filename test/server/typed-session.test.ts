import {
  ActionFunction,
  createCookie,
  createCookieSessionStorage,
  isSession,
  json,
  LoaderFunction,
} from "@remix-run/node";
import { z } from "zod";
import {
  createTypedCookie,
  createTypedSessionStorage,
  isTypedSession,
} from "../../src";

let cookie = createCookie("session", { secrets: ["secret"] });
let schema = z.object({
  token: z.string().optional(),
  count: z.number().default(1),
  message: z.string().optional(),
});

let typedCookie = createTypedCookie({ cookie, schema });

let sessionStorage = createCookieSessionStorage({ cookie: typedCookie });

let typedSessionStorage = createTypedSessionStorage({
  sessionStorage,
  schema,
});

let loader: LoaderFunction = async ({ request, context }) => {
  let session = await context.sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  let value = session.get(context.key);

  let headers = new Headers();
  headers.set(
    "Set-Cookie",
    await context.sessionStorage.commitSession(session)
  );

  return json({ value }, { headers });
};

let action: ActionFunction = async ({ request, context }) => {
  let session = await context.sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  let formData = await request.formData();

  context.flash
    ? session.flash(context.key, formData.get(context.key))
    : session.set(context.key, formData.get(context.key));

  let headers = new Headers();
  headers.set(
    "Set-Cookie",
    await context.sessionStorage.commitSession(session)
  );

  return json(null, { headers });
};

describe("Typed Sessions", () => {
  test("typedSessionStorage has correct methods", () => {
    expect(typedSessionStorage.getSession).toBeDefined();
    expect(typedSessionStorage.commitSession).toBeDefined();
    expect(typedSessionStorage.destroySession).toBeDefined();
  });

  test("getSession", async () => {
    let typedSession = await typedSessionStorage.getSession();

    // session.set works
    await typedSession.set("token", "a-b-c");
    expect(typedSession.has("token")).toBe(true);

    // session.data is updated
    expect(typedSession.data).toEqual({ count: 1, token: "a-b-c" });

    // session.has works
    expect(typedSession.has("count")).toBe(true);
  });

  test("isSession", async () => {
    let typedSession = await typedSessionStorage.getSession();
    expect(isSession(typedSession)).toBe(true);
  });

  test("isTypedSession", async () => {
    let typedSession = await typedSessionStorage.getSession();
    expect(isTypedSession(typedSession)).toBe(true);

    let session = await sessionStorage.getSession();
    expect(isTypedSession(session)).toBe(false);
  });

  test("session.get", async () => {
    let typedSession = await typedSessionStorage.getSession();

    expect(typedSession.get("count")).toBe(1);
  });

  test("use session.set", async () => {
    let formData = new FormData();
    formData.set("message", "normal value");

    let session = await typedSessionStorage.getSession();
    let initialCookie = await typedSessionStorage.commitSession(session);

    let headers = new Headers();
    headers.set("Cookie", initialCookie);

    let response = await action({
      request: new Request("http://remix.utils", {
        method: "POST",
        body: formData,
        headers,
      }),
      params: {},
      context: {
        sessionStorage: typedSessionStorage,
        key: "message",
        flash: false,
      },
    });

    // set value in expected header cookie
    session.set("message", "normal value");
    headers.delete("Cookie");
    headers.set("Set-Cookie", await typedSessionStorage.commitSession(session));

    await expect(
      loader({
        request: new Request("http://remix.utils", {
          headers: { Cookie: response.headers.get("Set-Cookie") },
        }),
        params: {},
        context: { sessionStorage: typedSessionStorage, key: "message" },
      })
    ).resolves.toEqual(json({ value: "normal value" }, { headers }));
  });

  test("use session.flash", async () => {
    let formData = new FormData();
    formData.set("message", "flash value");

    let session = await typedSessionStorage.getSession();
    let initialCookie = await typedSessionStorage.commitSession(session);

    let headers = new Headers();
    headers.set("Set-Cookie", initialCookie);

    let response = await action({
      request: new Request("http://remix.utils", {
        method: "POST",
        body: formData,
        headers,
      }),
      params: {},
      context: {
        sessionStorage: typedSessionStorage,
        key: "message",
        flash: true,
      },
    });

    session = await typedSessionStorage.getSession(
      response.headers.get("Set-Cookie")
    );

    await expect(
      loader({
        request: new Request("http://remix.utils", {
          headers: { Cookie: response.headers.get("Set-Cookie") },
        }),
        params: {},
        context: { sessionStorage: typedSessionStorage, key: "message" },
      })
    ).resolves.toEqual(json({ value: "flash value" }, { headers }));
  });
});
