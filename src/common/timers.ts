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
