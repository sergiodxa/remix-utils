import type { unstable_MiddlewareFunction } from "react-router";
import {
	unstable_RouterContextProvider,
	unstable_createContext,
} from "react-router";

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
		(context: unstable_RouterContextProvider) => string,
	];
}

function defaultGenerator() {
	return crypto.randomUUID();
}
