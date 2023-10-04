import type { RouterState } from "@remix-run/router";
import type { AppData } from "@remix-run/server-runtime";
import type { Location, Params, RouteMatch } from "@remix-run/react";

export type HandleConventionArguments<Data extends AppData = AppData> = {
  id: string;
  data: Data;
  params: Params;
  matches: RouteMatch[];
  location: Location;
  parentsData: RouterState["loaderData"];
};
