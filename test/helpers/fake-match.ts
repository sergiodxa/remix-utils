import { RouteData } from "@remix-run/react/routeData";

export function fakeMatch(data?: RouteData) {
  return { id: "routes/index", data, pathname: "/", handle: {}, params: {} };
}
