import { RouteMatch } from "@remix-run/react";
import { RouteData } from "@remix-run/router/dist/utils";

export function fakeMatch(data?: RouteData): RouteMatch {
	return { id: "root", data, pathname: "/", handle: {}, params: {} };
}
