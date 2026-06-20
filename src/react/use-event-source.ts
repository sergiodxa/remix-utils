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
 * @module Hook/Use Event Source
 */
import { createContext, useContext, useEffect, useState } from "react";

export interface EventSourceOptions {
	init?: EventSourceInit;
	event?: string;
	enabled?: boolean;
}

export type EventSourceMap = Map<string, { count: number; source: EventSource }>;

const context = createContext<EventSourceMap>(
	new Map<string, { count: number; source: EventSource }>(),
);

export const EventSourceProvider = context.Provider;

/**
 * Subscribe to an event source and return the latest event.
 * @param url The URL of the event source to connect to
 * @param options The options to pass to the EventSource constructor
 * @returns The last event received from the server
 */
export function useEventSource(
	url: string | URL,
	{ event = "message", init, enabled = true }: EventSourceOptions = {},
) {
	let map = useContext(context);
	let [data, setData] = useState<string | null>(null);

	useEffect(() => {
		if (!enabled) {
			return undefined;
		}

		let key = [url.toString(), init?.withCredentials].join("::");

		let value = map.get(key) ?? {
			count: 0,
			source: new EventSource(url, init),
		};

		++value.count;

		map.set(key, value);

		value.source.addEventListener(event, handler);

		// rest data if dependencies change
		setData(null);

		function handler(event: MessageEvent) {
			setData(event.data || "UNKNOWN_EVENT_DATA");
		}

		return () => {
			value.source.removeEventListener(event, handler);
			--value.count;
			if (value.count <= 0) {
				value.source.close();
				map.delete(key);
			}
		};
	}, [url, event, init, map, enabled]);

	return data;
}
