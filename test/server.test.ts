import { bodyParser, json } from "../src/server";

describe("Server Utils", () => {
  describe("parseBody", () => {
    it("reads the body as a URLSearchParams instance", async () => {
      const request = new Request("/", {
        method: "POST",
        body: new URLSearchParams({ framework: "Remix" }).toString(),
      });
      const body = await bodyParser.toSearchParams(request);
      expect(body).toBeInstanceOf(URLSearchParams);
      expect(body.get("framework")).toBe("Remix");
    });
  });

  describe("json", () => {
    it("returns a response with the JSON data", async () => {
      const response = json({ framework: "Remix" } as const);
      const body = await response.json();
      expect(body.framework).toBe("Remix");
    });
  });
});
