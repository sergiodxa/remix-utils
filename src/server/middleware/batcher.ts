import { Batcher } from "@edgefirst-dev/batcher";
import { unstable_createSingletonMiddleware } from "./singleton.js";

/**
 * Create a middleware that provides a singleton of a Batcher class.
 * @returns A tuple containing the middleware function and a function to get the
 * batcher instance from the context.
 */
export function unstable_createBatcherMiddleware() {
	return unstable_createSingletonMiddleware({
		Class: Batcher,
		arguments: [],
	});
}
