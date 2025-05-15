/**
 * The Request ID middleware generates a unique ID for each request and stores it in the Router context, this can be useful to log the request and response information and correlate them.
 *
 * ```ts
 * import { unstable_createRequestIDMiddleware } from "remix-utils/middleware/request-id";
 *
 * export const [requestIDMiddleware, getRequestID] =
 *   unstable_createRequestIDMiddleware();
 * ```
 *
 * To use it, you need to add it to the `unstable_middleware` array in your `app/root.tsx` file.
 *
 * ```ts
 * import { requestIDMiddleware } from "~/middleware/request-id.server";
 *
 * export const unstable_middleware = [requestIDMiddleware];
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
 * By default the request ID is a UUID, but you can customize it by passing a function to the `unstable_createRequestIDMiddleware` function.
 *
 * ```ts
 * import { unstable_createRequestIDMiddleware } from "remix-utils/middleware/request-id";
 *
 * export const [requestIDMiddleware, getRequestID] =
 *   unstable_createRequestIDMiddleware({
 *     generator() {
 *       return Math.random().toString(36).slice(2);
 *     },
 *   });
 * ```
 *
 * The middleware also gets the request ID from the `X-Request-ID` header if it's present, this can be useful to correlate requests between services.
 *
 * If you want to use a different header you can pass the header name to the `unstable_createRequestIDMiddleware` function.
 *
 * ```ts
 * import { unstable_createRequestIDMiddleware } from "remix-utils/middleware/request-id";
 *
 * export const [requestIDMiddleware, getRequestID] =
 *   unstable_createRequestIDMiddleware({
 *     header: "X-Correlation-ID",
 *   });
 * ```
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Middleware/Request ID
 */
import type { unstable_MiddlewareFunction } from "react-router";
import {
	unstable_RouterContextProvider,
	unstable_createContext,
} from "react-router";
import type { unstable_MiddlewareGetter } from "./utils.js";

export function unstable_createRequestIDMiddleware({
	generator = defaultGenerator,
	header = "X-Request-ID",
	limitLength = 255,
}: unstable_createRequestIDMiddleware.Options = {}): unstable_createRequestIDMiddleware.ReturnType {
	let requestIdContext = unstable_createContext<string>();

	return [
		function requestIDMiddleware({ request, context }, next) {
			let requestId = request.headers.get(header);
			if (
				!requestId ||
				requestId.length > limitLength ||
				/[^\w\-]/.test(requestId)
			) {
				requestId = generator();
			}
			context.set(requestIdContext, requestId);
			return next();
		},

		function getRequestID(context: unstable_RouterContextProvider) {
			return context.get(requestIdContext);
		},
	];
}

export namespace unstable_createRequestIDMiddleware {
	export interface Options {
		/**
		 * The name of the header to read the request ID from.
		 *
		 * @default "X-Request-ID"
		 */
		header?: string;

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
		unstable_MiddlewareFunction<Response>,
		unstable_MiddlewareGetter<string>,
	];
}

function defaultGenerator() {
	return crypto.randomUUID();
}
