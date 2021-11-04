import { bodyParser, json, redirectBack } from "../src/server";

describe("Server Utils", () => {
  describe("redirectBack", () => {
    it("uses the referer if available", () => {
      const request = new Request("/", {
        headers: { Referer: "/referer" },
      });
      const response = redirectBack(request, { fallback: "/fallback" });
      expect(response.headers.get("Location")).toBe("/referer");
    });

    it("uses the fallback if referer is not available", () => {
      const request = new Request("/");
      const response = redirectBack(request, { fallback: "/fallback" });
      expect(response.headers.get("Location")).toBe("/fallback");
    });
  });

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
