import {
  badRequest,
  forbidden,
  html,
  javascript,
  json,
  notFound,
  notModified,
  pdf,
  redirectBack,
  serverError,
  stylesheet,
  unauthorized,
  unprocessableEntity,
} from "../../src";

let jsonContentType = "application/json; charset=utf-8";

describe("Responses", () => {
  describe(json, () => {
    it("returns a response with the JSON data", async () => {
      const response = json({ framework: "Remix" } as const);
      const body = await response.json();
      expect(body.framework).toBe("Remix");
    });
  });

  describe(redirectBack, () => {
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

  describe(notModified, () => {
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

  describe(badRequest, () => {
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

  describe(unauthorized, () => {
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

  describe(forbidden, () => {
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

  describe(notFound, () => {
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

  describe(unprocessableEntity, () => {
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

  describe(serverError, () => {
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

  describe(javascript, () => {
    test("Should return Response with status 200", () => {
      let response = javascript("console.log('hello world');");
      expect(response).toEqual(
        new Response("console.log('hello world');", {
          status: 200,
          headers: { "Content-Type": "application/javascript; charset=utf-8" },
        })
      );
    });

    test("Should allow defining the status as second options", () => {
      let response = javascript("console.log('hello world');", 201);
      expect(response).toEqual(
        new Response("console.log('hello world');", {
          status: 201,
          headers: { "Content-Type": "application/javascript; charset=utf-8" },
        })
      );
    });

    test("Should allow changing the Response headers", () => {
      let response = javascript("console.log('hello world');", {
        headers: { "X-Test": "it worked" },
      });
      expect(response).toEqual(
        new Response("console.log('hello world');", {
          status: 200,
          headers: {
            "X-Test": "it worked",
            "Content-Type": "application/javascript; charset=utf-8",
          },
        })
      );
    });
  });

  describe(stylesheet, () => {
    test("Should return Response with status 200", () => {
      let response = stylesheet("body { color: red; }");
      expect(response).toEqual(
        new Response("body { color: red; }", {
          status: 200,
          headers: { "Content-Type": "text/css; charset=utf-8" },
        })
      );
    });

    test("Should allow defining the status as second options", () => {
      let response = stylesheet("body { color: red; }", 201);
      expect(response).toEqual(
        new Response("body { color: red; }", {
          status: 201,
          headers: { "Content-Type": "text/css; charset=utf-8" },
        })
      );
    });

    test("Should allow changing the Response headers", () => {
      let response = stylesheet("body { color: red; }", {
        headers: { "X-Test": "it worked" },
      });
      expect(response).toEqual(
        new Response("body { color: red; }", {
          status: 200,
          headers: {
            "X-Test": "it worked",
            "Content-Type": "text/css; charset=utf-8",
          },
        })
      );
    });
  });

  describe(pdf, () => {
    test("Should return Response with status 200", () => {
      let blob = new Blob();
      let response = pdf(blob);
      expect(response).toEqual(
        new Response(blob, {
          status: 200,
          headers: { "Content-Type": "application/pdf" },
        })
      );
    });

    test("Should allow defining the status as second options", () => {
      let blob = new Blob();
      let response = pdf(blob, 201);
      expect(response).toEqual(
        new Response(blob, {
          status: 201,
          headers: { "Content-Type": "application/pdf" },
        })
      );
    });

    test("Should allow changing the Response headers", () => {
      let blob = new Blob();
      let response = pdf(blob, {
        headers: { "X-Test": "it worked" },
      });
      expect(response).toEqual(
        new Response(blob, {
          status: 200,
          headers: {
            "X-Test": "it worked",
            "Content-Type": "application/pdf",
          },
        })
      );
    });
  });

  describe(html, () => {
    test("Should return Response with status 200", () => {
      let response = html("<h1>Hello World</h1>");
      expect(response).toEqual(
        new Response("<h1>Hello World</h1>", {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        })
      );
    });

    test("Should allow defining the status as second options", () => {
      let response = html("<h1>Hello World</h1>", 201);
      expect(response).toEqual(
        new Response("<h1>Hello World</h1>", {
          status: 201,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        })
      );
    });

    test("Should allow changing the Response headers", () => {
      let response = html("<h1>Hello World</h1>", {
        headers: { "X-Test": "it worked" },
      });
      expect(response).toEqual(
        new Response("<h1>Hello World</h1>", {
          status: 200,
          headers: {
            "X-Test": "it worked",
            "Content-Type": "text/html; charset=utf-8",
          },
        })
      );
    });
  });
});
