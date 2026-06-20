/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/sse-server` and `bunx shadcn@latest add @remix-utils/sse-react`.
 *
 * > [!NOTE]
 * > This depends on `react`.
 *
 * Server-Sent Events are a way to send data from the server to the client without the need for the client to request it. This is useful for things like chat applications, live updates, and more.
 *
 * There are two utils provided to help with the usage inside Remix:
 *
 * - `eventStream`
 * - `useEventSource`
 *
 * The `eventStream` function is used to create a new event stream response needed to send events to the client. This must live in a [Resource Route](https://remix.run/docs/en/1.18.1/guides/resource-routes).
 *
 * ```ts
 * // app/routes/sse.time.ts
 * import { eventStream } from "remix-utils/sse/server";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	return eventStream(request.signal, function setup(send) {
 * 		let intervalId = setInterval(() => {
 * 			send({ event: "time", data: new Date().toISOString() });
 * 		}, 1000);
 *
 * 		return () => void clearInterval(intervalId); // Cleanup function
 * 	});
 * }
 * ```
 *
 * Then, inside any component, you can use the `useEventSource` hook to connect to the event stream.
 *
 * ```tsx
 * // app/components/counter.ts
 * import { useEventSource } from "remix-utils/sse/react";
 *
 * function Counter() {
 * 	// Here `/sse/time` is the resource route returning an eventStream response
 * 	let time = useEventSource("/sse/time", { event: "time" });
 *
 * 	if (!time) return null;
 *
 * 	return (
 * 		<time dateTime={time}>
 * 			{new Date(time).toLocaleTimeString("en", {
 * 				minute: "2-digit",
 * 				second: "2-digit",
 * 				hour: "2-digit",
 * 			})}
 * 		</time>
 * 	);
 * }
 * ```
 *
 * The `event` name in both the event stream and the hook is optional, in which case it will default to `message`, if defined you must use the same event name in both sides, this also allows you to emit different events from the same event stream.
 *
 * For Server-Sent Events to work, your server must support HTTP streaming. If you don't get SSE to work check if your deployment platform has support for it.
 *
 * Because SSE count towards the limit of HTTP connections per domain, the `useEventSource` hook keeps a global map of connections based on the provided URL and options. As long as they are the same, the hook will open a single SSE connection and share it between instances of the hook.
 *
 * Once there are no more instances of the hook re-using a connection, it will be closed and removed from the map.
 *
 * You can use the `<EventSourceProvider />` component to control the map.
 *
 * ```tsx
 * let map: EventSourceMap = new Map();
 * return (
 * 	<EventSourceProvider value={map}>
 * 		<YourAppOrPartOfIt />
 * 	</EventSourceProvider>
 * );
 * ```
 *
 * This way, you can overwrite the map with a new one for a specific part of your app. Note that this provider is optional and a default map will be used if you don't provide one.
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Server/Event Stream
 */
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

type InitFunction = (send: SendFunction, abort: AbortFunction) => CleanupFunction;

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
