/**
 * @see https://twitter.com/buildsghost/status/1507109734519750680
 */
export type PromiseHash = Record<string, Promise<unknown>>;

export type AwaitedPromiseHash<Hash extends PromiseHash> = {
	[Key in keyof Hash]: Awaited<Hash[Key]>;
};

/**
 * Get a hash of promises and await them all.
 * Then return the same hash with the resolved values.
 * @example
 * export async function loader({ request }: LoaderFunctionArgs) {
 *   return json(
 *     promiseHash({
 *       user: getUser(request),
 *       posts: getPosts(request),
 *     })
 *   );
 * }
 * @example
 * export async function loader({ request }: LoaderFunctionArgs) {
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
export async function promiseHash<Hash extends PromiseHash>(
	hash: Hash,
): Promise<AwaitedPromiseHash<Hash>> {
	return Object.fromEntries(
		await Promise.all(
			Object.entries(hash).map(async ([key, promise]) => [key, await promise]),
		),
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
export function timeout<Value>(
	promise: Promise<Value>,
	options: { controller?: AbortController; ms: number },
): Promise<Value> {
	return new Promise(async (resolve, reject) => {
		let timer: NodeJS.Timeout | null = null;

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
				return reject(new TimeoutError(`Timed out after ${options.ms}ms`));
			}

			return resolve(result as Awaited<Value>);
		} catch (error) {
			if (timer) clearTimeout(timer);
			reject(error);
		}
	});
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
