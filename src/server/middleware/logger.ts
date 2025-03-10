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
