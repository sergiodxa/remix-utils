import { notModified, redirectBack } from "../../src/server";

describe("Responses", () => {
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

  describe("Not Modified", () => {
    test("Should return Response with status 304", () => {
      let response = notModified();
      expect(response).toEqual(new Response("", { status: 304 }));
    });

    test("Should allow changing the Response headers", () => {
      let response = notModified({
        headers: { "X-Test": "it worked" },
      });
      expect(response).toEqual(
        new Response("", {
          status: 304,
          headers: { "X-Test": "it worked" },
        })
      );
    });
  });
});
