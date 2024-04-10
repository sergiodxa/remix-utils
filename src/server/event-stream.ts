interface SendFunctionArgs<T = string> {
	/**
	 * @default "message"
	 */
	event?: string;
	data: T;
}

interface SendFunction<T = string> {
	(args: SendFunctionArgs<T>): void;
}

interface CleanupFunction {
	(): void;
}

interface AbortFunction {
	(): void;
}

interface InitFunction<T = string> {
	(send: SendFunction<T>, abort: AbortFunction): CleanupFunction;
}

interface HandleFunction<T = string> {
	(send: SendFunction<T>, abort: AbortFunction): Promise<void> | void;
}

interface Options<T = string> {
	cleanup: CleanupFunction;
	handle: HandleFunction<T>;
}

/**
 * A response helper to use Server Sent Events server-side
 * @param signal The AbortSignal used to close the stream
 * @param init The function that will be called to initialize the stream, here you can subscribe to your events
 * @returns A Response object that can be returned from a loader
 */
export function eventStream<T = string>(
	signal: AbortSignal,
	init: InitFunction<T>,
	responseInit?: ResponseInit,
): Response;
export function eventStream<T = string>(
	signal: AbortSignal,
	options: Options<T>,
	responseInit?: ResponseInit,
): Response;
export function eventStream<T = string>(
	signal: AbortSignal,
	initOrOptions: InitFunction<T> | Options<T>,
	responseInit: ResponseInit = {},
) {
	let stream = new ReadableStream({
		start(controller) {
			let encoder = new TextEncoder();

			let cleanup =
				typeof initOrOptions === "function"
					? initOrOptions(send, close)
					: initOrOptions.cleanup;

			if (typeof initOrOptions !== "function") {
				initOrOptions.handle(send, close);
			}

			let closed = false;

			function close() {
				if (closed) return;
				cleanup();
				closed = true;
				signal.removeEventListener("abort", close);
				controller.close();
			}

			signal.addEventListener("abort", close);

			if (signal.aborted) return close();

			async function send({ event = "message", data }: SendFunctionArgs<T>) {
				controller.enqueue(encoder.encode(`event: ${event}\n`));
				controller.enqueue(encoder.encode(`data: ${data}\n\n`));
			}
		},
	});

	let headers = new Headers(responseInit.headers);

	if (headers.has("Content-Type")) {
		console.warn("Overriding Content-Type header to `text/event-stream`");
	}

	if (headers.has("Cache-Control")) {
		console.warn("Overriding Cache-Control header to `no-cache`");
	}

	if (headers.has("Connection")) {
		console.warn("Overriding Connection header to `keep-alive`");
	}

	headers.set("Content-Type", "text/event-stream");
	headers.set("Cache-Control", "no-cache");
	headers.set("Connection", "keep-alive");

	return new Response(stream, { ...responseInit, headers });
}
