import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { createRoutesStub, useFetcher } from "react-router";

import { getFetcherType, useFetcherType } from "../../src/react/fetcher-type";

describe(getFetcherType.name, () => {
	test("returns done", () => {
		expect(
			getFetcherType(
				{ state: "idle", data: "data", formMethod: undefined },
				{ state: "idle", formMethod: undefined },
			),
		).toBe("done");
	});

	test("returns actionSubmission", () => {
		expect(
			getFetcherType(
				{ state: "submitting", data: "data", formMethod: undefined },
				{ state: "idle", formMethod: undefined },
			),
		).toBe("actionSubmission");
	});

	test("returns actionReload", () => {
		expect(
			getFetcherType(
				{ state: "loading", data: "data", formMethod: "POST" },
				{ state: "idle", formMethod: "POST" },
			),
		).toBe("actionReload");
	});

	test("returns actionRedirect", () => {
		expect(
			getFetcherType(
				{ state: "loading", data: null, formMethod: "POST" },
				{ state: "idle", formMethod: "POST" },
			),
		).toBe("actionRedirect");
	});

	test("returns loaderSubmission", () => {
		expect(
			getFetcherType(
				{ state: "loading", data: null, formMethod: undefined },
				{ state: "loading", formMethod: "GET" },
			),
		).toBe("loaderSubmission");
	});

	test("returns normalLoad", () => {
		expect(
			getFetcherType(
				{ state: "idle", data: null, formMethod: undefined },
				{ state: "loading", formMethod: undefined },
			),
		).toBe("normalLoad");
	});

	test("returns init", () => {
		expect(
			getFetcherType(
				{ state: "idle", data: null, formMethod: undefined },
				{ state: "idle", formMethod: undefined },
			),
		).toBe("init");
	});
});

describe(useFetcherType.name, () => {
	function Component() {
		let fetcher = useFetcher();
		let fetcherType = useFetcherType(fetcher);
		return <h1>{fetcherType}</h1>;
	}

	let RemixStub = createRoutesStub([
		{ id: "root", path: "/", index: true, Component },
	]);

	test("renders init", () => {
		render(
			<RemixStub
				initialEntries={["/"]}
				future={{ v2_normalizeFormMethod: true }}
			/>,
		);

		let $h1 = screen.getByRole("heading", { level: 1 });

		expect($h1.textContent).toBe("init");
	});
});
