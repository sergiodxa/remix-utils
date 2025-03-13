import { mock } from "bun:test";
import {
	type Params,
	type unstable_MiddlewareFunction,
	unstable_RouterContextProvider,
} from "react-router";

const defaultNext = mock().mockImplementation(() => Response.json(null));

export function runMiddleware<T = Response>(
	middleware: unstable_MiddlewareFunction<T>,
	{
		request = new Request("https://remix.utils"),
		context = new unstable_RouterContextProvider(),
		params = {},
		next = defaultNext,
	}: {
		request?: Request;
		params?: Params;
		context?: unstable_RouterContextProvider;
		next?: () => T | Promise<T>;
	} = {},
) {
	return middleware({ request, params, context }, next);
}
