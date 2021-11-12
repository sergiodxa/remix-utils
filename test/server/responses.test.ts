import { notModified } from "../../src/server";

describe("Responses", () => {
  describe("Not Modified", () => {
    test("Shoudl return Response with status 304", () => {
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
