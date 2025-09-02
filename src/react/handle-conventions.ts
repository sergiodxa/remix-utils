import type { Location, Params, RouterState, useMatches } from "react-router";

export type HandleConventionArguments<Data = unknown> = {
	id: string;
	data: Data;
	params: Params;
	matches: ReturnType<typeof useMatches>;
	location: Location;
	parentsData: RouterState["loaderData"];
};
