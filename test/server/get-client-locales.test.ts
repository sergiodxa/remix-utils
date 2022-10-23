import { getClientLocales } from "../../src";

describe(getClientLocales, () => {
  test("should return undefined if no Accept-Language header is not present", () => {
    let request = new Request("/");
    expect(getClientLocales(request)).toBeUndefined();
    expect(getClientLocales(request.headers)).toBeUndefined();
  });

  test.only("should return a string if there's only one locale", () => {
    let headers = new Headers({
      "Accept-Language": "en-US",
    });
    let request = new Request("/", { headers });
    expect(getClientLocales(request)).toEqual(["en-US"]);
    expect(getClientLocales(request.headers)).toEqual(["en-US"]);
  });

  test("should return undefined if there's no valid locale", () => {
    let headers = new Headers({
      "Accept-Language": "*",
    });
    let request = new Request("/", { headers });
    expect(getClientLocales(request)).toBeUndefined();
    expect(getClientLocales(request.headers)).toBeUndefined();
  });

  test("should return an array of locale sorted by quality", () => {
    let headers = new Headers({
      "Accept-Language": "en-US,de;q=0.7, en;q=0.8",
    });
    let request = new Request("/", { headers });
    expect(getClientLocales(request)).toEqual(["en-US", "en", "de"]);
    expect(getClientLocales(request.headers)).toEqual(["en-US", "en", "de"]);
  });

  test("can be used with Intl", () => {
    let headers = new Headers({
      "Accept-Language": "en-US,de;q=0.7, en;q=0.8",
    });
    let request = new Request("/", { headers });

    let locale = getClientLocales(request);

    let date = new Date("1992-09-29T00:00:00.000Z");

    expect(
      new Intl.DateTimeFormat(locale, { timeZone: "UTC" }).format(date)
    ).toMatchInlineSnapshot(`"9/29/1992"`);

    expect(
      date.toLocaleString(locale, { timeZone: "UTC" })
    ).toMatchInlineSnapshot(`"9/29/1992, 12:00:00 AM"`);
  });
});
