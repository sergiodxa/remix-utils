import {
  badRequest,
  forbidden,
  json,
  notFound,
  notModified,
  redirectBack,
  serverError,
  unauthorized,
  unprocessableEntity,
} from "../../src";

let jsonContentType = "application/json; charset=utf-8";

describe("Responses", () => {
  describe("json", () => {
    it("returns a response with the JSON data", async () => {
      const response = json({ framework: "Remix" } as const);
      const body = await response.json();
      expect(body.framework).toBe("Remix");
    });
  });

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

  describe("Bad Request", () => {
    test("Should return Response with status 404", () => {
      let response = badRequest({});
      expect(response).toEqual(
        new Response("{}", {
          status: 400,
          headers: { "Content-Type": jsonContentType },
        })
      );
    });

    test("Should allow changing the Response headers", () => {
      let response = badRequest({}, { headers: { "X-Test": "it worked" } });
      expect(response).toEqual(
        new Response("{}", {
          status: 400,
          headers: { "X-Test": "it worked", "Content-Type": jsonContentType },
        })
      );
    });
  });

  describe("Unauthorized", () => {
    test("Should return Response with status 401", () => {
      let response = unauthorized({});
      expect(response).toEqual(
        new Response("{}", {
          status: 401,
          headers: { "Content-Type": jsonContentType },
        })
      );
    });

    test("Should allow changing the Response headers", () => {
      let response = unauthorized({}, { headers: { "X-Test": "it worked" } });
      expect(response).toEqual(
        new Response("{}", {
          status: 401,
          headers: { "X-Test": "it worked", "Content-Type": jsonContentType },
        })
      );
    });
  });

  describe("Forbidden", () => {
    test("Should return Response with status 403", () => {
      let response = forbidden({});
      expect(response).toEqual(
        new Response("{}", {
          status: 403,
          headers: { "Content-Type": jsonContentType },
        })
      );
    });

    test("Should allow changing the Response headers", () => {
      let response = forbidden({}, { headers: { "X-Test": "it worked" } });
      expect(response).toEqual(
        new Response("{}", {
          status: 403,
          headers: { "X-Test": "it worked", "Content-Type": jsonContentType },
        })
      );
    });
  });

  describe("Not Found", () => {
    test("Should return Response with status 404", () => {
      let response = notFound({});
      expect(response).toEqual(
        new Response("{}", {
          status: 404,
          headers: { "Content-Type": jsonContentType },
        })
      );
    });

    test("Should allow changing the Response headers", () => {
      let response = notFound({}, { headers: { "X-Test": "it worked" } });
      expect(response).toEqual(
        new Response("{}", {
          status: 404,
          headers: { "X-Test": "it worked", "Content-Type": jsonContentType },
        })
      );
    });
  });

  describe("Unprocessable Entity", () => {
    test("Should return Response with status 422", () => {
      let response = unprocessableEntity({});
      expect(response).toEqual(
        new Response("{}", {
          status: 422,
          headers: { "Content-Type": jsonContentType },
        })
      );
    });

    test("Should allow changing the Response headers", () => {
      let response = unprocessableEntity(
        {},
        { headers: { "X-Test": "it worked" } }
      );
      expect(response).toEqual(
        new Response("{}", {
          status: 422,
          headers: { "X-Test": "it worked", "Content-Type": jsonContentType },
        })
      );
    });
  });

  describe("Server Error", () => {
    test("Should return Response with status 500", () => {
      let response = serverError({});
      expect(response).toEqual(
        new Response("{}", {
          status: 500,
          headers: { "Content-Type": jsonContentType },
        })
      );
    });

    test("Should allow changing the Response headers", () => {
      let response = serverError({}, { headers: { "X-Test": "it worked" } });
      expect(response).toEqual(
        new Response("{}", {
          status: 500,
          headers: { "X-Test": "it worked", "Content-Type": jsonContentType },
        })
      );
    });
  });
});
