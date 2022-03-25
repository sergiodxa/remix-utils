import { promiseHash } from "../../src";

describe(promiseHash, () => {
  test("should await all promises in a hash and return them with the same name", async () => {
    let result = await promiseHash({
      a: Promise.resolve(1),
      b: Promise.resolve(2),
      c: Promise.resolve(3),
    });

    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  test("should work with nested objects", async () => {
    let result = await promiseHash({
      a: promiseHash({ b: Promise.resolve(1), c: Promise.resolve(2) }),
      d: promiseHash({ e: Promise.resolve(3), f: Promise.resolve(4) }),
    });

    expect(result).toEqual({
      a: { b: 1, c: 2 },
      d: { e: 3, f: 4 },
    });
  });
});
