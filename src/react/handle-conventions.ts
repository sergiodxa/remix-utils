import type { RouterState } from "react-router";
import type { Location, Params, useMatches } from "react-router";

export type HandleConventionArguments<Data = unknown> = {
	id: string;
	data: Data;
	params: Params;
	matches: ReturnType<typeof useMatches>;
	location: Location;
	parentsData: RouterState["loaderData"];
};
