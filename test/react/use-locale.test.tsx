import { RouteData } from "@remix-run/react/routeData";
import { useLocale } from "../../src";
import { fakeMatch } from "../helpers/fake-match";
import { mockMatches } from "../helpers/mock-match";

jest.mock("@remix-run/react");

describe(useLocale, () => {
  test("should return undefined if matches is empty", () => {
    mockMatches([]);
    expect(useLocale()).toBeUndefined();
  });

  test("should retur undefined if matches is undefined", () => {
    mockMatches(undefined as []);
    expect(useLocale()).toBeUndefined();
  });

  test("should return undefined if root match has no data", () => {
    mockMatches([fakeMatch()]);
    expect(useLocale()).toBeUndefined();
  });

  test("should return undefined if root data is not an object", () => {
    mockMatches([fakeMatch("" as unknown as RouteData)]);
    expect(useLocale()).toBeUndefined();
  });

  test("should return undefined if root data is null", () => {
    mockMatches([fakeMatch(null)]);
    expect(useLocale()).toBeUndefined();
  });

  test("should return undefined if root data is an arry", () => {
    mockMatches([fakeMatch([])]);
    expect(useLocale()).toBeUndefined();
  });

  test("should return undefined if root data doesn't have locale", () => {
    mockMatches([fakeMatch({})]);
    expect(useLocale()).toBeUndefined();
  });

  test("should return undefined if locale is an array without only strings", () => {
    mockMatches([fakeMatch({ locale: ["en", 123] })]);
    expect(useLocale()).toBeUndefined();
  });

  describe("should return the locale value", () => {
    test("Undefined", () => {
      mockMatches([fakeMatch({ locale: undefined })]);
      expect(useLocale()).toBeUndefined();
    });

    test("String", () => {
      mockMatches([fakeMatch({ locale: "en" })]);
      expect(useLocale()).toBe("en");
    });

    test("Array", () => {
      mockMatches([fakeMatch({ locale: ["en"] })]);
      expect(useLocale()).toEqual(["en"]);
    });
  });
});
