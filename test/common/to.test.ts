import { to } from "../../src";

describe(to.name, () => {
  test("returns a string with the changed pathname", () => {
    expect(to({ pathname: "/foo/bar" })).toBe("/foo/bar");
  });

  test("returns a string with the changed search", () => {
    expect(to({ search: "?foo=bar" })).toBe("?foo=bar");
  });

  test("returns a string with the changed hash", () => {
    expect(to({ hash: "#foo" })).toBe("#foo");
  });

  test("returns a string with the changed search params", () => {
    expect(to({ searchParams: { foo: "bar" } })).toBe("?foo=bar");
  });

  test("returns a string with the changed search params (array)", () => {
    expect(
      to({
        searchParams: [
          ["foo", "bar"],
          ["foo", "baz"],
        ],
      })
    ).toBe("?foo=bar&foo=baz");
  });
});
