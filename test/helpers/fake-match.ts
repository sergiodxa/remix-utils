import { RouteMatch } from "react-router";

// biome-ignore lint/suspicious/noExplicitAny: RouteData is not exported anymore, route match has issues
export function fakeMatch(data?: any): any {
	return { id: "root", data, pathname: "/", handle: {}, params: {} };
}
