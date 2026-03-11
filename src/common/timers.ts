/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/timers`.
 *
 * The timers utils gives you a way to wait a certain amount of time before doing something or to run some code every certain amount of time.
 *
 * Using the `interval` combined with `eventStream` we could send a value to the client every certain amount of time. And ensure the interval is cancelled if the connection is closed.
 *
 * ```ts
 * import { eventStream } from "remix-utils/sse/server";
 * import { interval } from "remix-utils/timers";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	return eventStream(request.signal, function setup(send) {
 * 		async function run() {
 * 			for await (let _ of interval(1000, { signal: request.signal })) {
 * 				send({ event: "time", data: new Date().toISOString() });
 * 			}
 * 		}
 *
 * 		run();
 * 	});
 * }
 * ```
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Common/Timers
 */
import { setTimeout } from "node:timers/promises";

interface Options {
	signal?: AbortSignal;
}

/**
 * Get an async iterable that yields on an interval until aborted.
 * @param ms The amount of time to wait between intervals, in milliseconds
 * @param options The options for the timer
 * @returns An async iterable that yields on each intervals
 * @example
 * let controller = new AbortController();
 * for await (let _ of interval(1000, { signal: controller.signal })) {
 *  // Do something every second until aborted
 * }
 */
export async function* interval(ms: number, options?: Options) {
	let signal = options?.signal ?? new AbortSignal();
	while (!signal.aborted) {
		try {
			yield await setTimeout(ms, void 0, { signal });
		} catch {
			return;
		}
	}
}

export class TimersError extends globalThis.Error {}
