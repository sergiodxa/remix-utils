import type { PromiseValue } from "type-fest";
/**
 * @see https://twitter.com/buildsghost/status/1507109734519750680
 */
export type PromiseHash = Record<string, Promise<unknown>>;

export type AwaitedPromiseHash<Hash extends PromiseHash> = {
  [Key in keyof Hash]: PromiseValue<Hash[Key]>;
};

/**
 * Get a hash of promises and await them all.
 * Then return the same hash with the resolved values.
 * @example
 * export let loader: LoaderFunction = async ({ request }) => {
 *   return json(
 *     promiseHash({
 *       user: getUser(request),
 *       posts: getPosts(request),
 *     })
 *   );
 * };
 * @example
 * export let loader: LoaderFunction = async ({ request }) => {
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
 * };
 */
export async function promiseHash<Hash extends PromiseHash>(
  hash: Hash
): Promise<AwaitedPromiseHash<Hash>> {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(hash).map(async ([key, promise]) => [key, await promise])
    )
  );
}
