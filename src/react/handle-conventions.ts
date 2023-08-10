import type { RouterState } from "@remix-run/router";
import type { AppData } from "@remix-run/server-runtime";
import type { Location, Params } from "@remix-run/react";
import { Matches } from "./matches-type";

export type HandleConventionArguments<Data extends AppData = AppData> = {
  id: string;
  data: Data;
  params: Params;
  location: Location;
  parentsData: RouterState["loaderData"];
  matches: Matches;
};
