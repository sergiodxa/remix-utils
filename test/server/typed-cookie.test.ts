import {
  createCookie,
  createCookieSessionStorage,
  isCookie,
} from "@remix-run/node";
import { z, ZodError } from "zod";
import { createTypedCookie, isTypedCookie } from "../../src";

describe("Typed Cookie", () => {
  let cookie = createCookie("name", { secrets: ["secret"] });
  let typedCookie = createTypedCookie({
    cookie,
    schema: z.string().min(3),
  });

  test("isCookie pass", () => {
    expect(isCookie(typedCookie)).toBe(true);
  });

  test("throw if serialized type is not valid", async () => {
    await expect(() => typedCookie.serialize("a")).rejects.toThrowError(
      ZodError
    );
    // @ts-expect-error We now this will be a TS error
    await expect(() => typedCookie.serialize(123)).rejects.toThrowError(
      ZodError
    );
  });

  test("throw if parsed type is not valid", async () => {
    let cookieHeader = await cookie.serialize("a");
    await expect(() => typedCookie.parse(cookieHeader)).rejects.toThrowError(
      ZodError
    );
  });

  test("sessionStorage must accepts typed-cookie", async () => {
    let cookie = createCookie("name", { secrets: ["secret"] });
    let schema = z.object({ token: z.string() });

    let typedCookie = createTypedCookie({ cookie, schema });

    let sessionStorage = createCookieSessionStorage({ cookie: typedCookie });

    let cookieHeader = await typedCookie.serialize({ token: "a-b-c" });

    let session = await sessionStorage.getSession(cookieHeader);

    expect(schema.parse(session.data)).toEqual({ token: "a-b-c" });

    session.unset("token");

    await expect(() =>
      sessionStorage.commitSession(session)
    ).rejects.toThrowError(ZodError);
  });

  test("supports async schemas", async () => {
    let cookie = createCookie("name", { secrets: ["secret"] });
    let schema = z.object({
      token: z.string().refine(async () => {
        return false;
      }, "INVALID_TOKEN"),
    });

    let typedCookie = createTypedCookie({ cookie, schema });

    expect(() =>
      typedCookie.serialize({ token: "a-b-c" })
    ).rejects.toThrowError(ZodError);
  });

  test("pass isTypedCookie", async () => {
    expect(isTypedCookie(typedCookie)).toBe(true);
    expect(isTypedCookie(cookie)).toBe(false);
  });
});
