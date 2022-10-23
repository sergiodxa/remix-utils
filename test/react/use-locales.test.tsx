import { RouteData } from "@remix-run/react/routeData";
import { useLocales } from "../../src";
import { fakeMatch } from "../helpers/fake-match";
import { mockMatches } from "../helpers/mock-match";

jest.mock("@remix-run/react");

describe(useLocales, () => {
  test("should return undefined if matches is empty", () => {
    mockMatches([]);
    expect(useLocales()).toBeUndefined();
  });

  test("should retur undefined if matches is undefined", () => {
    mockMatches(undefined as []);
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
    mockMatches([fakeMatch(null)]);
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
      mockMatches([fakeMatch({ locales: "en" })]);
      expect(useLocales()).toBe(undefined);
    });

    test("Array", () => {
      mockMatches([fakeMatch({ locales: ["en"] })]);
      expect(useLocales()).toEqual(["en"]);
    });
  });
});
