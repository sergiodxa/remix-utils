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
import { userEvent } from "@testing-library/user-event";
import * as React from "react";
import { Outlet, createRoutesStub } from "react-router";
import { PrefetchPageAnchors } from "./use-delegated-anchors";

const navigate = mock();

// biome-ignore lint/suspicious/noSkippedTests: Test pass with happy-dom but using it globally breaks other tests, so we skip it for now
describe.skip(PrefetchPageAnchors.name, () => {
	// This test is not really testing anything useful
	test("treats child anchors as links", async () => {
		let user = userEvent.setup();

		let Stub = createRoutesStub([
			{
				id: "root",
				Component: Outlet,
				children: [
					{
						id: "index",
						index: true,
						Component() {
							return (
								<PrefetchPageAnchors>
									<a href="/link">Some link</a>
								</PrefetchPageAnchors>
							);
						},
					},
				],
			},
		]);

		render(<Stub hydrationData={{ loaderData: {} }} />);

		await user.click(screen.getByRole("link", { name: "Some link" }));
	});

	// biome-ignore lint/suspicious/noSkippedTests: Fix later
	test.skip("handles query string and hash", () => {
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

	// biome-ignore lint/suspicious/noSkippedTests: Fix later
	test.skip("handles children inside anchor", () => {
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

	// biome-ignore lint/suspicious/noSkippedTests: Fix later
	test.skip("ignores non-anchors", () => {
		render(
			<PrefetchPageAnchors>
				<div>Not a link</div>
			</PrefetchPageAnchors>,
		);

		fireEvent.click(screen.getByText("Not a link"));

		expect(navigate).not.toHaveBeenCalled();
	});

	// biome-ignore lint/suspicious/noSkippedTests: Fix later
	test.skip("ignores external links", () => {
		render(
			<PrefetchPageAnchors>
				<a href="https://example.com">A link</a>
			</PrefetchPageAnchors>,
		);

		fireEvent.click(screen.getByText("A link"));

		expect(navigate).not.toHaveBeenCalled();
	});

	// biome-ignore lint/suspicious/noSkippedTests: Fix later
	test.skip("ignores internal download links", () => {
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

	// biome-ignore lint/suspicious/noSkippedTests: Fix later
	test.skip("ignore clicks with modifiers and right clicks", () => {
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

	// biome-ignore lint/suspicious/noSkippedTests: Fix later
	test.skip("ignores links with target=_blank", () => {
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

	// biome-ignore lint/suspicious/noSkippedTests: Fix later
	describe.skip("nested configuration checks", () => {
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

		test("only calls navigate once", () => {
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
