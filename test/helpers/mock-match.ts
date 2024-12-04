import { vi } from "bun:test";
import { RouteMatch } from "react-router";

const { mockMatches } = vi.hoisted(() => {
	return { mockMatches: vi.fn<never, RouteMatch[]>() };
});

vi.mock("react-router", () => {
	return { useMatches: mockMatches };
});

export { mockMatches };
