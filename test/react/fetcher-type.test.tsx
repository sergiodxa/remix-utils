// @vitest-environment happy-dom
import * as React from "react";
import { describe, test, expect } from "vitest";
import { unstable_createRemixStub as createRemixStub } from "@remix-run/testing";
import { render, screen } from "@testing-library/react";

import { getFetcherType, useFetcherType } from "../../src/react/fetcher-type";
import { useFetcher } from "@remix-run/react";

describe(getFetcherType, () => {
  test("returns done", () => {
    expect(
      getFetcherType(
        { state: "idle", data: "data", formMethod: undefined },
        { state: "idle", formMethod: undefined }
      )
    ).toBe("done");
  });

  test("returns actionSubmission", () => {
    expect(
      getFetcherType(
        { state: "submitting", data: "data", formMethod: undefined },
        { state: "idle", formMethod: undefined }
      )
    ).toBe("actionSubmission");
  });

  test("returns actionReload", () => {
    expect(
      getFetcherType(
        { state: "loading", data: "data", formMethod: "POST" },
        { state: "idle", formMethod: "POST" }
      )
    ).toBe("actionReload");
  });

  test("returns actionRedirect", () => {
    expect(
      getFetcherType(
        { state: "loading", data: null, formMethod: "POST" },
        { state: "idle", formMethod: "POST" }
      )
    ).toBe("actionRedirect");
  });

  test("returns loaderSubmission", () => {
    expect(
      getFetcherType(
        { state: "loading", data: null, formMethod: undefined },
        { state: "loading", formMethod: "GET" }
      )
    ).toBe("loaderSubmission");
  });

  test("returns normalLoad", () => {
    expect(
      getFetcherType(
        { state: "idle", data: null, formMethod: undefined },
        { state: "loading", formMethod: undefined }
      )
    ).toBe("normalLoad");
  });

  test("returns init", () => {
    expect(
      getFetcherType(
        { state: "idle", data: null, formMethod: undefined },
        { state: "idle", formMethod: undefined }
      )
    ).toBe("init");
  });
});

describe(useFetcherType, () => {
  function Component() {
    let fetcher = useFetcher();
    let fetcherType = useFetcherType(fetcher);
    return <h1>{fetcherType}</h1>;
  }

  let RemixStub = createRemixStub([
    { id: "root", path: "/", index: true, element: <Component /> },
  ]);

  test("renders init", () => {
    render(
      <RemixStub
        initialEntries={["/"]}
        remixConfigFuture={{ v2_normalizeFormMethod: true }}
      />
    );

    let $h1 = screen.getByRole("heading", { level: 1 });

    expect($h1.textContent).toBe("init");
  });
});
