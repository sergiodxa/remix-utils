import { RouteMatch } from "react-router";
import { vi } from "vitest";

const { mockMatches } = vi.hoisted(() => {
	return { mockMatches: vi.fn<never, RouteMatch[]>() };
});

vi.mock("react-router", () => {
	return { useMatches: mockMatches };
});

export { mockMatches };
