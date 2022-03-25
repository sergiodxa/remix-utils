import { RouteData } from "@remix-run/react/routeData";

export function fakeMatch(data?: RouteData) {
  return { data, pathname: "/", handle: {}, params: {} };
}
