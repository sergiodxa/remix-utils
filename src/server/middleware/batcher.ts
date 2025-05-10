/**
 * > This depends on `@edgefirst-dev/batcher`.
 *
 * The batcher middleware let's you get a per request instance of a batcher object that will dedupe and batch multiple calls to the same function.
 *
 * This is specially useful to avoid making multiple API calls to the same endpoint in a single request, or DB queries. The batcher will call the function only once and return the same result to all calls.
 *
 * ```ts
 * import { unstable_createBatcherMiddleware } from "remix-utils/middleware/batcher";
 *
 * export const [batcherMiddleware, getBatcher] =
 *   unstable_createBatcherMiddleware();
 * ```
 *
 * To use it, you need to add it to the `unstable_middleware` array in the route where you want to use it.
 *
 * ```ts
 * import { batcherMiddleware } from "~/middleware/batcher.server";
 * export const unstable_middleware = [batcherMiddleware];
 * ```
 *
 * And you can use the `getBatcher` function in your loaders to get the batcher object.
 *
 * ```ts
 * import { getBatcher } from "~/middleware/batcher.server";
 *
 * export async function loader({ context }: LoaderFunctionArgs) {
 *   let batcher = getBatcher(context);
 *   let result = await batcher.batch("key", async () => {
 *     return await getData();
 *   });
 *   // ...
 * }
 * ```
 *
 * If you move your `batcher.batch` call to a separate function, you can use it in different route loaders and actions, and the batcher will still dedupe the calls.
 *
 * ```ts
 * import type { Batcher } from "remix-utils/middleware/batcher";
 * import { getData } from "~/data";
 *
 * export function getDataBatched(batcher: Batcher) {
 *   return batcher.batch("key", async () => {
 *     return await getData();
 *   });
 * }
 * ```
 *
 * Then you can call it in any route loader who has access to the batcher.
 *
 * ```ts
 * import { getBatcher } from "~/middleware/batcher.server";
 * import { getDataBatched } from "~/data";
 *
 * export async function loader({ context }: LoaderFunctionArgs) {
 *   let batcher = getBatcher(context);
 *   let result = await getDataBatched(batcher);
 *   // ...
 * }
 * ```
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Middleware/Batcher
 */
import { Batcher } from "@edgefirst-dev/batcher";
import { unstable_createSingletonMiddleware } from "./singleton.js";

/**
 * Create a middleware that provides a singleton of a Batcher class.
 * @returns A tuple containing the middleware function and a function to get the
 * batcher instance from the context.
 */
export function unstable_createBatcherMiddleware() {
	return unstable_createSingletonMiddleware({
		instantiator: () => new Batcher(),
	});
}

export type { Batcher };
