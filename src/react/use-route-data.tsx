import { useMatches } from "@remix-run/react";

export function useRouteData<Data>(route: string): Data | undefined {
  return useMatches().find(
    (match) => match.handle?.id === route || match.pathname === route
  )?.data as Data | undefined;
}
