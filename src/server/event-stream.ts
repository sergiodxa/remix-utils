interface SendFunctionArgs {
	/**
	 * @default "message"
	 */
	event?: string;
	id?: string;
	data: string;
}

type SendFunction = (args: SendFunctionArgs) => void;

type CleanupFunction = () => void;

type AbortFunction = () => void;

type InitFunction = (
	send: SendFunction,
	abort: AbortFunction,
) => CleanupFunction;

/**
 * A response helper to use Server Sent Events server-side
 * @param signal The AbortSignal used to close the stream
 * @param init The function that will be called to initialize the stream, here you can subscribe to your events
 * @returns A Response object that can be returned from a loader
 */
export function eventStream(
	signal: AbortSignal,
	init: InitFunction,
	options: ResponseInit = {},
	strategy?: QueuingStrategy,
) {
	let stream = new ReadableStream(
		{
			start(controller) {
				let encoder = new TextEncoder();
				let closed = false;

				function send({ event = "message", data, id }: SendFunctionArgs) {
					if (closed) return; // If already closed, not enqueue anything
					if (id) controller.enqueue(encoder.encode(`id: ${id}\n`));
					controller.enqueue(encoder.encode(`event: ${event}\n`));

					if (closed) return; // If already closed, not enqueue anything

					data.split("\n").forEach((line, index, array) => {
						if (closed) return; // If already closed, not enqueue anything
						let value = `data: ${line}\n`;
						if (index === array.length - 1) value += "\n";
						controller.enqueue(encoder.encode(value));
					});
				}

				let cleanup = init(send, close);

				function close() {
					if (closed) return;
					cleanup();
					closed = true;
					signal.removeEventListener("abort", close);
					controller.close();
				}

				signal.addEventListener("abort", close);

				if (signal.aborted) return close();
			},
		},
		strategy,
	);

	let headers = new Headers(options.headers);

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

	return new Response(stream, { headers });
}
