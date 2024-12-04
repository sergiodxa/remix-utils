import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { createRoutesStub, useFetcher } from "react-router";

import { getFetcherType, useFetcherType } from "./fetcher-type";

// biome-ignore lint/suspicious/noSkippedTests: Test pass with happy-dom but using it globally breaks other tests, so we skip it for now
describe.skip(getFetcherType.name, () => {
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

// biome-ignore lint/suspicious/noSkippedTests: Test pass with happy-dom but using it globally breaks other tests, so we skip it for now
describe.skip(useFetcherType.name, () => {
	function Component() {
		let fetcher = useFetcher();
		let fetcherType = useFetcherType(fetcher);
		return <h1>{fetcherType}</h1>;
	}

	let Stub = createRoutesStub([
		{ id: "root", path: "/", index: true, Component },
	]);

	test("renders init", () => {
		render(<Stub initialEntries={["/"]} />);

		let $h1 = screen.getByRole("heading", { level: 1 });

		expect($h1.textContent).toBe("init");
	});
});
