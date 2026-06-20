/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/promise`.
 *
 * The `promiseHash` function is not directly related to Remix but it's a useful function when working with loaders and actions.
 *
 * This function is an object version of `Promise.all` which lets you pass an object with promises and get an object with the same keys with the resolved values.
 *
 * ```ts
 * import { promiseHash } from "remix-utils/promise";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	return json(
 * 		await promiseHash({
 * 			user: getUser(request),
 * 			posts: getPosts(request),
 * 		}),
 * 	);
 * }
 * ```
 *
 * You can use nested `promiseHash` to get a nested object with resolved values.
 *
 * ```ts
 * import { promiseHash } from "remix-utils/promise";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	return json(
 * 		await promiseHash({
 * 			user: getUser(request),
 * 			posts: promiseHash({
 * 				list: getPosts(request),
 * 				comments: promiseHash({
 * 					list: getComments(request),
 * 					likes: getLikes(request),
 * 				}),
 * 			}),
 * 		}),
 * 	);
 * }
 * ```
 *
 * ---
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/promise`.
 *
 * The `timeout` function lets you attach a timeout to any promise, if the promise doesn't resolve or reject before the timeout, it will reject with a `TimeoutError`.
 *
 * ```ts
 * import { timeout } from "remix-utils/promise";
 *
 * try {
 * 	let result = await timeout(fetch("https://example.com"), { ms: 100 });
 * } catch (error) {
 * 	if (error instanceof TimeoutError) {
 * 		// Handle timeout
 * 	}
 * }
 * ```
 *
 * Here the fetch needs to happen in less than 100ms, otherwise it will throw a `TimeoutError`.
 *
 * If the promise is cancellable with an AbortSignal you can pass the AbortController to the `timeout` function.
 *
 * ```ts
 * import { timeout } from "remix-utils/promise";
 *
 * try {
 * 	let controller = new AbortController();
 * 	let result = await timeout(fetch("https://example.com", { signal: controller.signal }), {
 * 		ms: 100,
 * 		controller,
 * 	});
 * } catch (error) {
 * 	if (error instanceof TimeoutError) {
 * 		// Handle timeout
 * 	}
 * }
 * ```
 *
 * Here after 100ms, `timeout` will call `controller.abort()` which will mark the `controller.signal` as aborted.
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Common/Promise
 */
/**
 * @see https://twitter.com/buildsghost/status/1507109734519750680
 */
export type PromiseHash = Record<string, Promise<unknown>>;

export type AwaitedPromiseHash<Hash> = Hash extends PromiseHash
	? {
			[Key in keyof Hash]: Awaited<Hash[Key]>;
		}
	: never;

/**
 * Get a hash of promises and await them all.
 * Then return the same hash with the resolved values.
 * @example
 * export async function loader({ request }: Route.LoaderArgs) {
 *   return json(
 *     promiseHash({
 *       user: getUser(request),
 *       posts: getPosts(request),
 *     })
 *   );
 * }
 * @example
 * export async function loader({ request }: Route.LoaderArgs) {
 *   return json(
 *     promiseHash({
 *       user: getUser(request),
 *       posts: promiseHash({
 *         list: getPosts(request),
 *         comments: promiseHash({
 *           list: getComments(request),
 *           likes: getLikes(request),
 *         }),
 *       }),
 *     })
 *   );
 * }
 */
export async function promiseHash<Hash extends object>(
	hash: Hash,
): Promise<AwaitedPromiseHash<Hash>> {
	return Object.fromEntries(
		await Promise.all(Object.entries(hash).map(async ([key, promise]) => [key, await promise])),
	);
}

/**
 * Used to uniquely identify a timeout
 * @private
 */
let TIMEOUT = Symbol("TIMEOUT");

/**
 * Attach a timeout to any promise, if the timeout resolves first ignore the
 * original promise and throw an error
 * @param promise The promise to attach a timeout to
 * @param options The options to use
 * @param options.ms The number of milliseconds to wait before timing out
 * @param options.controller An AbortController to abort the original promise
 * @returns The result of the promise
 * @throws TimeoutError If the timeout resolves first
 * @example
 * try {
 *   let result = await timeout(
 *     fetch("https://example.com"),
 *     { ms: 100 }
 *   );
 * } catch (error) {
 *   if (error instanceof TimeoutError) {
 *     // Handle timeout
 *   }
 * }
 * @example
 * try {
 *   let controller = new AbortController();
 *   let result = await timeout(
 *     fetch("https://example.com", { signal: controller.signal }),
 *     { ms: 100, controller }
 *   );
 * } catch (error) {
 *   if (error instanceof TimeoutError) {
 *     // Handle timeout
 *   }
 * }
 */
export async function timeout<Value>(
	promise: Promise<Value>,
	options: { controller?: AbortController; ms: number },
): Promise<Value> {
	let timer: Timer | null = null;

	try {
		let result = await Promise.race([
			promise,
			new Promise((resolve) => {
				timer = setTimeout(() => resolve(TIMEOUT), options.ms);
			}),
		]);

		if (timer) clearTimeout(timer);

		if (result === TIMEOUT) {
			if (options.controller) options.controller.abort();
			throw new TimeoutError(`Timed out after ${options.ms}ms`);
		}

		return result as Awaited<Value>;
	} catch (error) {
		if (timer) clearTimeout(timer);
		throw error;
	}
}

/**
 * An error thrown when a timeout occurs
 * @example
 * try {
 *   let result = await timeout(fetch("https://example.com"), { ms: 100 });
 * } catch (error) {
 *   if (error instanceof TimeoutError) {
 *    // Handle timeout
 *   }
 * }
 */
export class TimeoutError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TimeoutError";
	}
}
