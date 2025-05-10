/**
 * The logger middleware let's you log the request and response information to
 * the console, this can be useful to debug issues with the request and response.
 *
 * ```ts
 * import { unstable_createLoggerMiddleware } from "remix-utils/middleware/logger";
 *
 * export const [loggerMiddleware] = unstable_createLoggerMiddleware();
 * ```
 *
 * To use it, you need to add it to the `unstable_middleware` array in your
 * `app/root.tsx` file.
 *
 * ```ts
 * import { loggerMiddleware } from "~/middleware/logger.server";
 * export const unstable_middleware = [loggerMiddleware];
 * ```
 *
 * Now, every request and response will be logged to the console.
 *
 * The logger middleware can be customized by passing an options object to the
 * `unstable_createLoggerMiddleware` function.
 *
 * ```ts
 * let [loggerMiddleware] = unstable_createLoggerMiddleware({
 *   logger: console,
 *   precision: 2,
 *   formatMessage(request, response, time) {
 *     return `${request.method} ${request.url} - ${response.status} - ${time}ms`;
 *   },
 * });
 * ```
 *
 * The `logger` option let's you pass a custom logger, the `precision` option
 * let's you set the number of decimal places to use in the response time, and
 * the `formatMessage` option let's you customize the message that will be
 * logged.
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Middleware/Logger
 */
import type { unstable_MiddlewareFunction } from "react-router";

function defaultFormatMessage(
	request: Request,
	response: Response,
	responseTime: string,
): string {
	let { method } = request;

	let url = new URL(request.url);

	let status = response.status;

	if (status >= 300 && status < 400) {
		let target = response.headers.get("location");
		return `${method} ${url.pathname}${url.search} → ${target}`;
	}

	return `${method} ${url.pathname}${url.search} ${status} ${responseTime} ms`;
}

export function unstable_createLoggerMiddleware({
	logger = console,
	precision = 3,
	formatMessage = defaultFormatMessage,
}: unstable_createLoggerMiddleware.Options = {}): unstable_createLoggerMiddleware.ReturnType {
	if (precision < 0) {
		throw new RangeError("Precision must be a positive number.");
	}

	return [
		async function loggerMiddleware({ request }, next) {
			let start = performance.now();
			let response = await next();
			let responseTime = (performance.now() - start).toPrecision(precision);

			let status = response.status;

			if (status >= 500) {
				logger.error(formatMessage(request, response, responseTime));
			} else if (status >= 400) {
				logger.warn(formatMessage(request, response, responseTime));
			} else if (status >= 300) {
				logger.debug(formatMessage(request, response, responseTime));
			} else {
				logger.info(formatMessage(request, response, responseTime));
			}

			return response;
		},
	];
}

export namespace unstable_createLoggerMiddleware {
	export interface Options {
		/**
		 * The logger to use for logging the request and response information.
		 * @default globalThis.console
		 */
		logger?: Logger;
		/**
		 * The number of significant digits to include in the response time.
		 * Must be in the range 1 - 21, inclusive.
		 * @default 3
		 */
		precision?: number;

		formatMessage?(
			request: Request,
			response: Response,
			responseTime: string,
		): string;
	}

	export type ReturnType = [unstable_MiddlewareFunction<Response>];

	export interface Logger {
		error(...message: string[]): void;
		warn(...message: string[]): void;
		info(...message: string[]): void;
		debug(...message: string[]): void;
	}
}
