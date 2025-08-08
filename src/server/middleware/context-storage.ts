/**
 * The Context Storage middleware stores the Router context provider and request in AsyncLocalStorage and gives you functions to access it in your code.
 *
 * ```ts
 * import { unstable_createContextStorageMiddleware } from "remix-utils/middleware/context-storage";
 *
 * export const [contextStorageMiddleware, getContext, getRequest] =
 *   unstable_createContextStorageMiddleware();
 * ```
 *
 * To use it, you need to add it to the `unstable_middleware` array in your `app/root.tsx` file.
 *
 * ```ts
 * import { contextStorageMiddleware } from "~/middleware/context-storage.server";
 *
 * export const unstable_middleware = [contextStorageMiddleware];
 * ```
 *
 * And you can use the `getContext` and `getRequest` functions in your function to get the context and request objects.
 *
 * ```ts
 * import { getContext, getRequest } from "~/middleware/context-storage.server";
 *
 * export async function doSomething() {
 *   let context = getContext();
 *   let request = getRequest();
 *   // ...
 * }
 * ```
 *
 * Then call `doSomething` in any loader, action, or another middleware, and you will have access to the context and request objects without passing them around.
 *
 * You can pair this with any other middleware that uses the context to simplify using their returned getters.
 *
 * ```ts
 * import { unstable_createBatcherMiddleware } from "remix-utils/middleware/batcher";
 * import { getContext } from "~/middleware/context-storage.server";
 *
 * const [batcherMiddleware, getBatcherFromContext] =
 *   unstable_createBatcherMiddleware();
 *
 * export { bathcherMiddleware };
 *
 * export function getBatcher() {
 *   let context = getContext();
 *   return getBatcherFromContext(context);
 * }
 * ```
 *
 * Now instead of calling `getBatcher(context)` you can just call `getBatcher()` and it will return the batcher instance.
 *
 * ```ts
 * import { getBatcher } from "~/middleware/batcher.server";
 *
 * export async function loader(_: Route.LoaderArgs) {
 *   let batcher = getBatcher();
 *   let result = await batcher.batch("key", async () => {
 *     return await getData();
 *   });
 *   // ...
 * }
 * ```
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Middleware/Context Storage
 */
import { AsyncLocalStorage } from "node:async_hooks";
import type {
	unstable_MiddlewareFunction,
	unstable_RouterContextProvider,
} from "react-router";

const storage = new AsyncLocalStorage<{
	context: Readonly<unstable_RouterContextProvider>;
	request: Request;
}>();

/**
 * Creates a context storage middleware that stores the context, and request,
 * in an AsyncLocalStorage.
 *
 * This is useful for accessing the context in any part of the application
 * inside loaders or actions, but without needing to pass the context around
 * from loaders or actions to those functions.
 *
 * After the middleware is added, any function that needs the context can
 * call the `getContext` function to retrieve the context from the storage.
 *
 * @returns The context storage middleware and a function to get the context from the storage
 * @example
 * // app/middlewares/context-storage.ts
 * import { unstable_createContextStorageMiddleware } from "remix-utils";
 *
 * export const [contextStorageMiddleware, getContext, getRequest] = unstable_createContextStorageMiddleware();
 *
 * // app/root.tsx
 * import { contextStorageMiddleware } from "~/middlewares/context-storage";
 * export const unstable_middleware = [contextStorageMiddleware];
 *
 * // app/helpers/authenticate.ts
 * import { getContext } from "~/middlewares/context-storage";
 * import { getSession } from "~/middlewares/session";
 *
 * export function authenticate() {
 *   let context = getContext();
 *   let session = getSession(context);
 *   // code to authenticate the user
 * }
 */
export function unstable_createContextStorageMiddleware(): unstable_createContextStorageMiddleware.ReturnType {
	return [
		async function contextStorageMiddleware({ request, context }, next) {
			return storage.run({ request, context }, next);
		},

		function getContext() {
			let store = storage.getStore();
			if (!store) {
				throw new Error(
					"Failed to retrieve context from storage. Did you forget to use the contextStorageMiddleware?",
				);
			}
			return store.context;
		},

		function getRequest() {
			let store = storage.getStore();
			if (!store) {
				throw new Error(
					"Failed to retrieve request from storage. Did you forget to use the contextStorageMiddleware?",
				);
			}
			return store.request;
		},
	];
}

export namespace unstable_createContextStorageMiddleware {
	export type ReturnType = [
		unstable_MiddlewareFunction<Response>,
		() => Readonly<unstable_RouterContextProvider>,
		() => Request,
	];
}
