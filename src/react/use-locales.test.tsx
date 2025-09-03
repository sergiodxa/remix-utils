import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { createRoutesStub, Outlet } from "react-router";
import { useLocales } from "./use-locales.js";

// biome-ignore lint/suspicious/noSkippedTests: Test pass with happy-dom but using it globally breaks other tests, so we skip it for now
describe.skip(useLocales.name, () => {
	afterEach(() => {
		cleanup();
	});

	test("should return undefined if there are not matches", () => {
		const Stub = createStub();
		render(<Stub hydrationData={{ loaderData: {} }} />);
		expect(screen.getByRole("paragraph").innerHTML).toBe("");
	});

	test("should return undefined if root match has no data", () => {
		const Stub = createStub();
		render(<Stub hydrationData={{ loaderData: { root: {} } }} />);
		expect(screen.getByRole("paragraph").innerText).toBe("");
	});

	test("should return undefined if root data is not an object", () => {
		const Stub = createStub();
		render(<Stub hydrationData={{ loaderData: { root: "" } }} />);
		expect(screen.getByRole("paragraph").innerText).toBe("");
	});

	test("should return undefined if root data is null", () => {
		const Stub = createStub();
		render(<Stub hydrationData={{ loaderData: { root: null } }} />);
		expect(screen.getByRole("paragraph").innerText).toBe("");
	});

	test("should return undefined if root data is an array", () => {
		const Stub = createStub();
		render(<Stub hydrationData={{ loaderData: { root: [] } }} />);
		expect(screen.getByRole("paragraph").innerText).toBe("");
	});

	test("should return undefined if root data doesn't have locales", () => {
		const Stub = createStub();
		render(<Stub hydrationData={{ loaderData: { root: {} } }} />);
		expect(screen.getByRole("paragraph").innerText).toBe("");
	});

	test("should return undefined if locales is an array without only strings", () => {
		const Stub = createStub();
		render(
			<Stub
				hydrationData={{ loaderData: { root: { locales: ["en", 123] } } }}
			/>,
		);
		expect(screen.getByRole("paragraph").innerText).toBe("");
	});

	describe("should return the locales value", () => {
		test("Undefined", () => {
			const Stub = createStub();
			render(
				<Stub
					hydrationData={{ loaderData: { root: { locales: undefined } } }}
				/>,
			);
			expect(screen.getByRole("paragraph").innerText).toBe("");
		});

		test("String", () => {
			const Stub = createStub();
			render(
				<Stub hydrationData={{ loaderData: { root: { locales: "en" } } }} />,
			);
			expect(screen.getByRole("paragraph").innerHTML).toBe("en");
		});

		test("Array", () => {
			const Stub = createStub();
			render(
				<Stub hydrationData={{ loaderData: { root: { locales: ["en"] } } }} />,
			);
			expect(screen.getByRole("paragraph").innerHTML).toBe("en");
		});
	});
});

function createStub() {
	return createRoutesStub([
		{
			id: "root",
			Component: Outlet,
			HydrateFallback: Outlet,
			children: [
				{
					id: "index",
					index: true,
					Component() {
						return <p>{useLocales()}</p>;
					},
				},
			],
		},
	]);
}
