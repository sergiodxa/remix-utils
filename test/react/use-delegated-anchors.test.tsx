import {
	afterAll,
	beforeAll,
	describe,
	expect,
	mock,
	spyOn,
	test,
} from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { PrefetchPageAnchors } from "../../src/react/use-delegated-anchors";

const navigate = mock();

// biome-ignore lint/suspicious/noSkippedTests: Fix
describe.skip(PrefetchPageAnchors.name, () => {
	test("it treats child anchors as links", () => {
		render(
			<PrefetchPageAnchors>
				<a href="/link">Some link</a>
			</PrefetchPageAnchors>,
		);

		fireEvent.click(screen.getByText("Some link"));

		expect(navigate).toHaveBeenCalledWith({
			hash: "",
			pathname: "/link",
			search: "",
		});
	});

	test("handles query string and hash", () => {
		render(
			<PrefetchPageAnchors>
				<a href="/link?query=string#hash">Some link</a>
			</PrefetchPageAnchors>,
		);

		fireEvent.click(screen.getByText("Some link"));

		expect(navigate).toHaveBeenCalledWith({
			hash: "#hash",
			pathname: "/link",
			search: "?query=string",
		});
	});

	test("handles children inside anchor", () => {
		render(
			<PrefetchPageAnchors>
				<a href="/link">
					<span>
						<span>Some link</span>
					</span>
				</a>
			</PrefetchPageAnchors>,
		);

		fireEvent.click(screen.getByText("Some link"));

		expect(navigate).toHaveBeenCalledWith({
			hash: "",
			pathname: "/link",
			search: "",
		});
	});

	test("ignores non-anchors", () => {
		render(
			<PrefetchPageAnchors>
				<div>Not a link</div>
			</PrefetchPageAnchors>,
		);

		fireEvent.click(screen.getByText("Not a link"));

		expect(navigate).not.toHaveBeenCalled();
	});

	test("ignores external links", () => {
		render(
			<PrefetchPageAnchors>
				<a href="https://example.com">A link</a>
			</PrefetchPageAnchors>,
		);

		fireEvent.click(screen.getByText("A link"));

		expect(navigate).not.toHaveBeenCalled();
	});

	test("ignores internal download links", () => {
		render(
			<PrefetchPageAnchors>
				<a href="/download" download>
					A link
				</a>
			</PrefetchPageAnchors>,
		);

		fireEvent.click(screen.getByText("A link"));

		expect(navigate).not.toHaveBeenCalled();
	});

	test("ignore clicks with modifiers and right clicks", () => {
		render(
			<PrefetchPageAnchors>
				<a href="/link">A link</a>
			</PrefetchPageAnchors>,
		);

		fireEvent.click(screen.getByText("A link"), {
			ctrlKey: true,
		});
		fireEvent.click(screen.getByText("A link"), {
			metaKey: true,
		});
		fireEvent.click(screen.getByText("A link"), {
			shiftKey: true,
		});
		fireEvent.click(screen.getByText("A link"), {
			button: 1,
		});

		expect(navigate).not.toHaveBeenCalled();
	});

	test("ignores links with target=_blank", () => {
		render(
			<PrefetchPageAnchors>
				<a href="/link" target="_blank" rel="noreferrer">
					A link
				</a>
			</PrefetchPageAnchors>,
		);

		fireEvent.click(screen.getByText("A link"));

		expect(navigate).not.toHaveBeenCalled();
	});

	describe("nested configuration checks", () => {
		const mockedConsoleError = mock();

		beforeAll(() => {
			spyOn(console, "error").mockImplementation(mockedConsoleError);
		});

		afterAll(() => {
			spyOn(console, "error").mockRestore();
		});

		const nested = (
			<PrefetchPageAnchors>
				<PrefetchPageAnchors>
					<a href="/link">A link</a>
				</PrefetchPageAnchors>
			</PrefetchPageAnchors>
		);

		test("it only calls navigate once", () => {
			render(nested);
			fireEvent.click(screen.getByText("A link"));

			expect(navigate).toHaveBeenCalledTimes(1);
			expect(navigate).toHaveBeenCalledWith({
				hash: "",
				pathname: "/link",
				search: "",
			});
		});
	});
});
