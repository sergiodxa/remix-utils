import type { AppData } from "@remix-run/server-runtime";
import type { Location, Params } from "react-router-dom";
import type { RouterState } from "@remix-run/router";
type RouteData = RouterState["loaderData"];

export type HandleConventionArguments<Data extends AppData = AppData> = {
	id: string;
	data: Data;
	params: Params;
	location: Location;
	parentsData: RouteData;
};
