import { useMatches } from "@remix-run/react";

jest.mock("@remix-run/react");

export function mockMatches(value: ReturnType<typeof useMatches>) {
  (useMatches as jest.MockedFunction<typeof useMatches>).mockReturnValue(value);
}
