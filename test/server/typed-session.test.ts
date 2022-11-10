import {
  createCookie,
  createCookieSessionStorage,
  isSession,
} from "@remix-run/node";
import { z } from "zod";
import {
  createTypedCookie,
  createTypedSessionStorage,
  isTypedSession,
} from "../../src";

describe("Typed Sessions", () => {
  let cookie = createCookie("session", { secrets: ["secret"] });
  let schema = z.object({
    token: z.string().optional(),
    count: z.number().default(1),
  });

  let typedCookie = createTypedCookie({ cookie, schema });

  let sessionStorage = createCookieSessionStorage({ cookie: typedCookie });

  let typedSessionStorage = createTypedSessionStorage({
    sessionStorage,
    schema,
  });

  test("has methods", () => {
    expect(typedSessionStorage.getSession).toBeDefined();
    expect(typedSessionStorage.commitSession).toBeDefined();
    expect(typedSessionStorage.destroySession).toBeDefined();
  });

  test("getSession", async () => {
    let typedSession = await typedSessionStorage.getSession();

    // session.set works
    typedSession.set("token", "a-b-c");
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
});
