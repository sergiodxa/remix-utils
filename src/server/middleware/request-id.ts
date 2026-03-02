/**
 * The Request ID middleware generates a unique ID for each request and stores it in the Router context, this can be useful to log the request and response information and correlate them.
 *
 * ```ts
 * import { createRequestIDMiddleware } from "remix-utils/middleware/request-id";
 *
 * export const [requestIDMiddleware, getRequestID] =
 *   createRequestIDMiddleware();
 * ```
 *
 * To use it, you need to add it to the `middleware` array in your `app/root.tsx` file.
 *
 * ```ts
 * import { requestIDMiddleware } from "~/middleware/request-id.server";
 *
 * export const middleware: Route.MiddlewareFunction[] = [requestIDMiddleware];
 * ```
 *
 * And you can use the `getRequestID` function in your loaders, actions, and other middleware to get the request ID.
 *
 * ```ts
 * import { getRequestID } from "~/middleware/request-id.server";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 *   let requestID = getRequestID();
 *   // ...
 * }
 * ```
 *
 * By default the request ID is a UUID, but you can customize it by passing a function to the `createRequestIDMiddleware` function.
 *
 * ```ts
 * import { createRequestIDMiddleware } from "remix-utils/middleware/request-id";
 *
 * export const [requestIDMiddleware, getRequestID] =
 *   createRequestIDMiddleware({
 *     generator() {
 *       return Math.random().toString(36).slice(2);
 *     },
 *   });
 * ```
 *
 * The middleware also gets the request ID from the `X-Request-ID` header if it's present, this can be useful to correlate requests between services.
 *
 * If you want to use a different header you can pass the header name to the `createRequestIDMiddleware` function.
 *
 * ```ts
 * import { createRequestIDMiddleware } from "remix-utils/middleware/request-id";
 *
 * export const [requestIDMiddleware, getRequestID] =
 *   createRequestIDMiddleware({
 *     header: "X-Correlation-ID",
 *   });
 * ```
 *
 * To disable this functionality, you can set the header property to `null` instead.
 *
 * ```ts
 * import { createRequestIDMiddleware } from "remix-utils/middleware/request-id";
 *
 * export const [requestIDMiddleware, getRequestID] =
 *   createRequestIDMiddleware({
 *     header: null,
 *   });
 * ```
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Middleware/Request ID
 */
import type { MiddlewareFunction } from "react-router";
import { createContext, RouterContextProvider } from "react-router";
import type { MiddlewareGetter } from "./utils.js";

export function createRequestIDMiddleware({
	generator = defaultGenerator,
	header = "X-Request-ID",
	limitLength = 255,
}: createRequestIDMiddleware.Options = {}): createRequestIDMiddleware.ReturnType {
	let requestIdContext = createContext<string>();

	return [
		function requestIDMiddleware({ request, context }, next) {
			let requestId;
			if (header) {
				requestId = request.headers.get(header);
			}
			if (
				!requestId ||
				requestId.length > limitLength ||
				/[^\w-]/.test(requestId)
			) {
				requestId = generator();
			}
			context.set(requestIdContext, requestId);
			return next();
		},

		function getRequestID(context: Readonly<RouterContextProvider>) {
			return context.get(requestIdContext);
		},
	];
}

export namespace createRequestIDMiddleware {
	export interface Options {
		/**
		 * The name of the header to read the request ID from.
		 *
		 * Pass `null` to disable reading the request ID from headers.
		 *
		 * @default "X-Request-ID"
		 */
		header?: string | null;

		/**
		 * The length of the request ID.
		 *
		 * @default 255
		 */
		limitLength?: number;

		/**
		 * A function to generate a request ID.
		 *
		 * @default () => crypto.randomUUID()
		 */
		generator?(): string;
	}

	export type ReturnType = [
		MiddlewareFunction<Response>,
		MiddlewareGetter<string>,
	];
}

function defaultGenerator() {
	return crypto.randomUUID();
}
