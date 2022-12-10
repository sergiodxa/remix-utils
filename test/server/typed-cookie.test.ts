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

    await expect(() =>
      typedCookie.serialize({ token: "a-b-c" })
    ).rejects.toThrowError(ZodError);
  });

  test("pass isTypedCookie", async () => {
    expect(isTypedCookie(typedCookie)).toBe(true);
    expect(isTypedCookie(cookie)).toBe(false);
  });

  test("supports flash keys", async () => {
    let typedCookie = createTypedCookie({
      cookie,
      schema: z.object({
        token: z.string().optional(),
      }),
    });

    await expect(
      typedCookie.parse(
        // @ts-expect-error serialized doesn't directly expect flash keys as
        // valids, use sessionStorage to make them work
        await typedCookie.serialize({ __flash_token__: "a-b-c" })
      )
    ).resolves.toEqual({ __flash_token__: "a-b-c" });
  });

  test("can store arrays", async () => {
    let typedCookie = createTypedCookie({
      cookie,
      schema: z.array(z.string()),
    });

    await expect(
      typedCookie.parse(await typedCookie.serialize(["a", "b", "c"]))
    ).resolves.toEqual(["a", "b", "c"]);
  });

  test("can't store functions", async () => {
    let typedCookie = createTypedCookie({
      cookie,
      schema: z.function().args(z.string()).returns(z.string()),
    });

    await expect(
      typedCookie.parse(await typedCookie.serialize((a: string) => a))
    ).rejects.toThrowError(
      new ZodError([
        {
          code: "invalid_type",
          expected: "function",
          received: "object",
          path: [],
          message: "Expected function, received object",
        },
      ])
    );
  });

  test("can store booleans", async () => {
    let typedCookie = createTypedCookie({
      cookie,
      schema: z.boolean(),
    });

    await expect(
      typedCookie.parse(await typedCookie.serialize(true))
    ).resolves.toEqual(true);

    await expect(
      typedCookie.parse(await typedCookie.serialize(false))
    ).resolves.toEqual(false);
  });

  test("can store numbers", async () => {
    let typedCookie = createTypedCookie({
      cookie,
      schema: z.number(),
    });

    await expect(
      typedCookie.parse(await typedCookie.serialize(123))
    ).resolves.toEqual(123);
  });

  test("can store dates", async () => {
    let typedCookie = createTypedCookie({
      cookie,
      schema: z.preprocess((value) => {
        if (typeof value === "string") return new Date(value);
        if (value instanceof Date) return value;
        throw new TypeError("Invalid value");
      }, z.date()),
    });

    await expect(
      typedCookie.parse(await typedCookie.serialize(new Date()))
    ).resolves.toBeInstanceOf(Date);
  });

  test("can store objects", async () => {
    let typedCookie = createTypedCookie({
      cookie,
      schema: z.object({
        token: z.string(),
      }),
    });

    await expect(
      typedCookie.parse(await typedCookie.serialize({ token: "a-b-c" }))
    ).resolves.toEqual({ token: "a-b-c" });
  });

  test("can store null", async () => {
    let typedCookie = createTypedCookie({
      cookie,
      schema: z.null(),
    });

    await expect(
      typedCookie.parse(await typedCookie.serialize(null))
    ).resolves.toEqual(null);
  });

  test.only("can store undefined", async () => {
    let typedCookie = createTypedCookie({
      cookie,
      schema: z.undefined(),
    });

    await expect(
      typedCookie.parse(await typedCookie.serialize(void 0))
    ).rejects.toThrowError(
      new ZodError([
        {
          code: "invalid_type",
          expected: "undefined",
          received: "object",
          path: [],
          message: "Expected undefined, received object",
        },
      ])
    );
  });
});
