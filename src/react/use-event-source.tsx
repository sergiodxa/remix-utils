import { useEffect, useState } from "react";

type EventSourceOptions = {
  init?: EventSourceInit;
  event?: string;
};

/**
 * Subscribe to an event source and return the latest event.
 * @param url The URL of the event source to connect to
 * @param options The options to pass to the EventSource constructor
 * @property withCredentials If true, send CORS headers
 * @returns The last event received from the server
 */
export function useEventSource(
  url: string | URL,
  { event = "message", init = {} }: EventSourceOptions = {}
) {
  const [data, setData] = useState<string | null>(null);
  const withCredentials = init.withCredentials;

  useEffect(() => {
    const eventSource = new EventSource(url, { withCredentials });
    eventSource.addEventListener("message", handler);

    // rest data if dependencies change
    setData(null);

    function handler(event: MessageEvent) {
      setData(event.data || "UNKNOWN_EVENT_DATA");
    }

    return () => {
      eventSource.removeEventListener(event ?? "message", handler);
      eventSource.close();
    };
  }, [url, event, withCredentials]);

  return data;
}
