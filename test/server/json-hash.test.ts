import { describe, test, expect } from "vitest";
import { jsonHash } from "../../src";

describe(jsonHash.name, () => {
  test("should return a response with a status code", async () => {
    let response = await jsonHash({}, 201);
    await expect(response.json()).resolves.toEqual({});
    expect(response.status).toBe(201);
  });

  test("should return a response with custom headers", async () => {
    let response = await jsonHash({}, { headers: { "Set-Cookie": "COOKIE" } });
    expect(response.headers.get("Set-Cookie")).toBe("COOKIE");
  });

  test("should resolve loader data", async () => {
    let response = await jsonHash({
      foo() {
        return "foo";
      },
      bar: "bar",
      async baz() {
        return "baz";
      },
      qux: Promise.resolve("qux"),
    });

    await expect(response.json()).resolves.toEqual({
      foo: "foo",
      bar: "bar",
      baz: "baz",
      qux: "qux",
    });
  });
});
