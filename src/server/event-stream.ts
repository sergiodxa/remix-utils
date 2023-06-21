interface SendFunctionArgs {
  /**
   * @default "message"
   */
  event?: string;
  data: string;
}

interface EventStreamOptions {
  headers: HeadersInit;
}

interface SendFunction {
  (args: SendFunctionArgs): void;
}

interface CleanupFunction {
  (): void;
}

interface AbortFunction {
  (): void;
}

interface InitFunction {
  (send: SendFunction, abort: AbortFunction): CleanupFunction;
}

/**
 * A response holper to use Server Sent Events server-side
 * @param signal The AbortSignal used to close the stream
 * @param init The function that will be called to initialize the stream, here you can subscribe to your events
 * @returns A Response object that can be returned from a loader
 */
export function eventStream(signal: AbortSignal, init: InitFunction, options: EventStreamOptions = { headers: {} }) {
  let stream = new ReadableStream({
    start(controller) {
      let encoder = new TextEncoder();

      function send({ event = "message", data }: SendFunctionArgs) {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }

      let cleanup = init(send, close);

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
    },
  });

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "text/event-stream");
  headers.set("Cache-Control",  "no-cache");
  headers.set("Connection", "keep-alive");

  return new Response(stream, { headers });
}
