// @vitest-environment happy-dom
import { afterEach, describe, expect, test, vi } from "vitest";
import { useLocales } from "../../src/react/use-locales";
import { fakeMatch } from "../helpers/fake-match";
import { mockMatches } from "../helpers/mock-match";
// TODO Fix this
// biome-ignore lint/suspicious/noExplicitAny: Route data not exported anymore
type RouteData = any;
describe.skip(useLocales, () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	test("should return undefined if matches is empty", () => {
		mockMatches([]);
		expect(useLocales()).toBeUndefined();
	});

	test("should retur undefined if matches is undefined", () => {
		mockMatches(undefined as unknown as []);
		expect(useLocales()).toBeUndefined();
	});

	test("should return undefined if root match has no data", () => {
		mockMatches([fakeMatch()]);
		expect(useLocales()).toBeUndefined();
	});

	test("should return undefined if root data is not an object", () => {
		mockMatches([fakeMatch("" as unknown as RouteData)]);
		expect(useLocales()).toBeUndefined();
	});

	test("should return undefined if root data is null", () => {
		mockMatches([fakeMatch(null as unknown as RouteData)]);
		expect(useLocales()).toBeUndefined();
	});

	test("should return undefined if root data is an arry", () => {
		mockMatches([fakeMatch([])]);
		expect(useLocales()).toBeUndefined();
	});

	test("should return undefined if root data doesn't have locales", () => {
		mockMatches([fakeMatch({})]);
		expect(useLocales()).toBeUndefined();
	});

	test("should return undefined if locales is an array without only strings", () => {
		mockMatches([fakeMatch({ locales: ["en", 123] })]);
		expect(useLocales()).toBeUndefined();
	});

	describe("should return the locales value", () => {
		test("Undefined", () => {
			mockMatches([fakeMatch({ locales: undefined })]);
			expect(useLocales()).toBeUndefined();
		});

		test("String", () => {
			mockMatches.mockReturnValue([fakeMatch({ locales: "en" })]);
			// mockMatches([fakeMatch({ locales: "en" })]);
			expect(useLocales()).toBe("en");
		});

		test("Array", () => {
			mockMatches([fakeMatch({ locales: ["en"] })]);
			expect(useLocales()).toEqual(["en"]);
		});
	});
});
