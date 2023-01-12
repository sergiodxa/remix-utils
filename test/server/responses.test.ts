import {
  badRequest,
  forbidden,
  html,
  xml,
  image,
  ImageType,
  javascript,
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
  describe(redirectBack, () => {
    it("uses the referer if available", () => {
      const request = new Request("http://remix.utils/", {
        headers: { Referer: "/referer" },
      });
      const response = redirectBack(request, { fallback: "/fallback" });
      expect(response.headers.get("Location")).toBe("/referer");
    });

    it("uses the fallback if referer is not available", () => {
      const request = new Request("http://remix.utils/");
      const response = redirectBack(request, { fallback: "/fallback" });
      expect(response.headers.get("Location")).toBe("/fallback");
    });
  });

  describe(notModified, () => {
    test("Should return Response with status 304", async () => {
      let response = notModified();
      await expect(response.text()).resolves.toBe("");
      expect(response.status).toBe(304);
    });

    test("Should allow changing the Response headers", async () => {
      let response = notModified({
        headers: { "X-Test": "it worked" },
      });
      await expect(response.text()).resolves.toBe("");
      expect(response.status).toBe(304);
      expect(response.headers.get("X-Test")).toBe("it worked");
    });
  });

  describe(badRequest, () => {
    test("Should return Response with status 404", async () => {
      let response = badRequest({});
      await expect(response.text()).resolves.toBe("{}");
      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe(jsonContentType);
    });

    test("Should allow changing the Response headers", async () => {
      let response = badRequest({}, { headers: { "X-Test": "it worked" } });
      await expect(response.text()).resolves.toBe("{}");
      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe(jsonContentType);
      expect(response.headers.get("X-Test")).toBe("it worked");
    });
  });

  describe(unauthorized, () => {
    test("Should return Response with status 401", async () => {
      let response = unauthorized({});
      await expect(response.text()).resolves.toBe("{}");
      expect(response.status).toBe(401);
      expect(response.headers.get("Content-Type")).toBe(jsonContentType);
    });

    test("Should allow changing the Response headers", async () => {
      let response = unauthorized({}, { headers: { "X-Test": "it worked" } });
      await expect(response.text()).resolves.toBe("{}");
      expect(response.status).toBe(401);
      expect(response.headers.get("Content-Type")).toBe(jsonContentType);
      expect(response.headers.get("X-Test")).toBe("it worked");
    });
  });

  describe(forbidden, () => {
    test("Should return Response with status 403", async () => {
      let response = forbidden({});
      await expect(response.text()).resolves.toBe("{}");
      expect(response.status).toBe(403);
      expect(response.headers.get("Content-Type")).toBe(jsonContentType);
    });

    test("Should allow changing the Response headers", async () => {
      let response = forbidden({}, { headers: { "X-Test": "it worked" } });
      await expect(response.text()).resolves.toBe("{}");
      expect(response.status).toBe(403);
      expect(response.headers.get("Content-Type")).toBe(jsonContentType);
      expect(response.headers.get("X-Test")).toBe("it worked");
    });
  });

  describe(notFound, () => {
    test("Should return Response with status 404", async () => {
      let response = notFound({});
      await expect(response.text()).resolves.toBe("{}");
      expect(response.status).toBe(404);
      expect(response.headers.get("Content-Type")).toBe(jsonContentType);
    });

    test("Should allow changing the Response headers", async () => {
      let response = notFound({}, { headers: { "X-Test": "it worked" } });
      await expect(response.text()).resolves.toBe("{}");
      expect(response.status).toBe(404);
      expect(response.headers.get("Content-Type")).toBe(jsonContentType);
      expect(response.headers.get("X-Test")).toBe("it worked");
    });
  });

  describe(unprocessableEntity, () => {
    test("Should return Response with status 422", async () => {
      let response = unprocessableEntity({});
      await expect(response.text()).resolves.toBe("{}");
      expect(response.status).toBe(422);
      expect(response.headers.get("Content-Type")).toBe(jsonContentType);
    });

    test("Should allow changing the Response headers", async () => {
      let response = unprocessableEntity(
        {},
        { headers: { "X-Test": "it worked" } }
      );
      await expect(response.text()).resolves.toBe("{}");
      expect(response.status).toBe(422);
      expect(response.headers.get("Content-Type")).toBe(jsonContentType);
      expect(response.headers.get("X-Test")).toBe("it worked");
    });
  });

  describe(serverError, () => {
    test("Should return Response with status 500", async () => {
      let response = serverError({});
      await expect(response.text()).resolves.toBe("{}");
      expect(response.status).toBe(500);
      expect(response.headers.get("Content-Type")).toBe(jsonContentType);
    });

    test("Should allow changing the Response headers", async () => {
      let response = serverError({}, { headers: { "X-Test": "it worked" } });
      await expect(response.text()).resolves.toBe("{}");
      expect(response.status).toBe(500);
      expect(response.headers.get("Content-Type")).toBe(jsonContentType);
      expect(response.headers.get("X-Test")).toBe("it worked");
    });
  });

  describe(javascript, () => {
    let content = "console.log('hello world');";
    test("Should return Response with status 200", async () => {
      let response = javascript(content);
      await expect(response.text()).resolves.toBe(content);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "application/javascript; charset=utf-8"
      );
    });

    test("Should allow defining the status as second options", async () => {
      let response = javascript(content, 201);
      await expect(response.text()).resolves.toBe(content);
      expect(response.status).toBe(201);
      expect(response.headers.get("Content-Type")).toBe(
        "application/javascript; charset=utf-8"
      );
    });

    test("Should allow changing the Response headers", async () => {
      let response = javascript(content, {
        headers: { "X-Test": "it worked" },
      });
      await expect(response.text()).resolves.toBe(content);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "application/javascript; charset=utf-8"
      );
      expect(response.headers.get("X-Test")).toBe("it worked");
    });
  });

  describe(stylesheet, () => {
    let content = "body { color: red; }";
    test("Should return Response with status 200", async () => {
      let response = stylesheet(content);
      await expect(response.text()).resolves.toBe(content);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "text/css; charset=utf-8"
      );
    });

    test("Should allow defining the status as second options", async () => {
      let response = stylesheet(content, 201);
      await expect(response.text()).resolves.toBe(content);
      expect(response.status).toBe(201);
      expect(response.headers.get("Content-Type")).toBe(
        "text/css; charset=utf-8"
      );
    });

    test("Should allow changing the Response headers", async () => {
      let response = stylesheet(content, {
        headers: { "X-Test": "it worked" },
      });
      await expect(response.text()).resolves.toBe(content);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "text/css; charset=utf-8"
      );
      expect(response.headers.get("X-Test")).toBe("it worked");
    });
  });

  describe(pdf, () => {
    test("Should return Response with status 200", async () => {
      let blob = new Blob();
      let response = pdf(blob);
      expect(response).toEqual(
        new Response(blob, {
          status: 200,
          headers: { "Content-Type": "application/pdf" },
        })
      );
    });

    test("Should allow defining the status as second options", async () => {
      let blob = new Blob();
      let response = pdf(blob, 201);
      expect(response).toEqual(
        new Response(blob, {
          status: 201,
          headers: { "Content-Type": "application/pdf" },
        })
      );
    });

    test("Should allow changing the Response headers", async () => {
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
    let content = "<h1>Hello World</h1>";
    test("Should return Response with status 200", async () => {
      let response = html(content);
      await expect(response.text()).resolves.toBe(content);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "text/html; charset=utf-8"
      );
    });

    test("Should allow defining the status as second options", async () => {
      let response = html(content, 201);
      await expect(response.text()).resolves.toBe(content);
      expect(response.status).toBe(201);
      expect(response.headers.get("Content-Type")).toBe(
        "text/html; charset=utf-8"
      );
    });

    test("Should allow changing the Response headers", async () => {
      let response = html(content, {
        headers: { "X-Test": "it worked" },
      });
      await expect(response.text()).resolves.toBe(content);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "text/html; charset=utf-8"
      );
      expect(response.headers.get("X-Test")).toBe("it worked");
    });
  });

  describe(xml, () => {
    let content = "<?xml version='1.0'?><catalog></catalog>";
    test("Should return Response with status 200", async () => {
      let response = xml(content);
      await expect(response.text()).resolves.toBe(content);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "application/xml; charset=utf-8"
      );
    });

    test("Should allow defining the status as second options", async () => {
      let response = xml(content, 201);
      await expect(response.text()).resolves.toBe(content);
      expect(response.status).toBe(201);
      expect(response.headers.get("Content-Type")).toBe(
        "application/xml; charset=utf-8"
      );
    });

    test("Should allow changing the Response headers", async () => {
      let response = xml(content, {
        headers: { "X-Test": "it worked" },
      });
      await expect(response.text()).resolves.toBe(content);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "application/xml; charset=utf-8"
      );
      expect(response.headers.get("X-Test")).toBe("it worked");
    });
  });

  describe(image, () => {
    let content = new ArrayBuffer(0);
    test.each([
      "image/webp",
      "image/bmp",
      "image/avif",
      "image/svg+xml",
      "image/png",
      "image/jpeg",
      "image/gif",
    ] as ImageType[])("%s", async (type) => {
      let response = image(content, { type });
      await expect(response.arrayBuffer()).resolves.toEqual(content);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(type);
    });
  });
});
