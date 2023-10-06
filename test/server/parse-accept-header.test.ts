import { describe, test, expect } from "vitest";
import { parseAcceptHeader } from "../../src/server/parse-accept-header";

describe(parseAcceptHeader, () => {
  test("parses a simple accept header", () => {
    let header = "text/html";

    let parsed = parseAcceptHeader(header);

    expect(parsed).toEqual([{ type: "text", subtype: "html", params: {} }]);
  });

  test("parses a more complex accept header", () => {
    let header =
      "text/html, application/xhtml+xml, application/xml;q=0.9, image/webp, image/*, */*;q=0.8";

    let parsed = parseAcceptHeader(header);

    expect(parsed).toEqual([
      { type: "text", subtype: "html", params: {} },
      { type: "application", subtype: "xhtml+xml", params: {} },
      { type: "application", subtype: "xml", params: { q: "0.9" } },
      { type: "image", subtype: "webp", params: {} },
      { type: "image", subtype: "*", params: {} },
      { type: "*", subtype: "*", params: { q: "0.8" } },
    ]);
  });
});
