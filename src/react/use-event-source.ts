import { useEffect, useState, createContext, useContext } from "react";

export interface EventSourceOptions {
	init?: EventSourceInit;
	event?: string;
}

export type EventSourceMap = Map<
	string,
	{ count: number; source: EventSource }
>;

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
	{ event = "message", init }: EventSourceOptions = {},
) {
	let map = useContext(context);
	let [data, setData] = useState<string | null>(null);

	useEffect(() => {
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
	}, [url, event, init, map]);

	return data;
}
