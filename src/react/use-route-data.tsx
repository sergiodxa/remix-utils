import { useMatches } from "@remix-run/react";

export function useRouteData<Data>(routeId: string): Data | undefined {
  return useMatches().find((match) => match.id === routeId)?.data as
    | Data
    | undefined;
}
