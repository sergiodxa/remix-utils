import { RouteData } from "@remix-run/react/dist/routeData";
import type { AppData } from "@remix-run/server-runtime";
import type { Location, Params } from "react-router-dom";
import { Matches } from "./matches-type";

export type HandleConventionArguments<Data extends AppData = AppData> = {
  id: string;
  data: Data;
  params: Params;
  location: Location;
  parentsData: RouteData;
  matches: Matches;
};
