import { RouteMatch } from "@remix-run/react";
import { vi } from "vitest";

const { mockMatches } = vi.hoisted(() => {
  return { mockMatches: vi.fn<never, RouteMatch[]>() };
});

vi.mock("@remix-run/react", () => {
  return { useMatches: mockMatches };
});

export { mockMatches };
