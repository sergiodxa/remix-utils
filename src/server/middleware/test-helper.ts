import { mock } from "bun:test";
import {
	type Params,
	type MiddlewareFunction,
	RouterContextProvider,
} from "react-router";

const defaultNext = mock().mockImplementation(() => Response.json(null));

export async function runMiddleware<T = Response>(
	middleware: MiddlewareFunction<T>,
	{
		request = new Request("https://remix.utils"),
		context = new RouterContextProvider(),
		params = {},
		next = defaultNext,
	}: {
		request?: Request;
		params?: Params;
		context?: Readonly<RouterContextProvider>;
		next?: () => Promise<T>;
	} = {},
) {
	return (await middleware({ request, params, context }, next)) as T;
}

export async function catchResponse<T>(promise: Promise<T>) {
	try {
		await promise;
		throw new Error("Expected promise to reject");
	} catch (exception) {
		if (exception instanceof Response) return exception;
		throw exception;
	}
}
