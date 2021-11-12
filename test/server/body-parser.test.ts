import { bodyParser } from "../../src/server/body-parser";

describe("Body Parser", () => {
  describe(bodyParser.toString, () => {
    test("should return string", async () => {
      let request = new Request("/", {
        method: "POST",
        body: new URLSearchParams("a=1&b=2"),
      });

      let body = await bodyParser.toString(request);

      expect(body).toBe("a=1&b=2");
    });
  });

  describe(bodyParser.toSearchParams, () => {
    test("should return URLSearchParams", async () => {
      let request = new Request("/", {
        method: "POST",
        body: new URLSearchParams("a=1&b=2"),
      });

      let params = await bodyParser.toSearchParams(request);

      expect(params.get("a")).toBe("1");
      expect(params.get("b")).toBe("2");
    });
  });

  describe(bodyParser.toJSON, () => {
    test("should return JS object", async () => {
      let request = new Request("/", {
        method: "POST",
        body: new URLSearchParams("a=1&b=2"),
      });

      let body = (await bodyParser.toJSON(request)) as { a: 1; b: 2 };

      expect(body).toEqual({ a: "1", b: "2" });
    });
  });
});
