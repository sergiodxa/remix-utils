/**
 * Test-only helpers for middleware unit tests.
 *
 * This file is not part of the public API and is not published as an
 * installable module. It exists to simplify middleware tests in this repo.
 *
 * `runMiddleware` executes a middleware with sensible defaults (`Request`,
 * `RouterContextProvider`, `params`, and `next`) so tests can focus on behavior.
 *
 * `catchResponse` is a small assertion helper for middleware that throws
 * `Response` instances.
 *
 * ```ts
 * let response = await runMiddleware(middleware, { request });
 * expect(response.status).toBe(200);
 *
 * let thrown = await catchResponse(runMiddleware(middleware));
 * expect(thrown.status).toBe(401);
 * ```
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Server/Middleware Test Helper
 */
import { mock } from "bun:test";
import { type MiddlewareFunction, type Params, RouterContextProvider } from "react-router";

const defaultNext = mock().mockImplementation(() => Response.json(null));

export async function runMiddleware<T = Response>(
	middleware: MiddlewareFunction<T>,
	{
		request = new Request("https://remix.utils"),
		context = new RouterContextProvider(),
		params = {},
		unstable_pattern = "",
		next = defaultNext,
	}: {
		request?: Request;
		params?: Params;
		context?: Readonly<RouterContextProvider>;
		unstable_pattern?: string;
		next?: () => Promise<T>;
	} = {},
) {
	return (await middleware({ request, params, context, unstable_pattern }, next)) as T;
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
