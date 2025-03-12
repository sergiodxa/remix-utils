import { AsyncLocalStorage } from "node:async_hooks";
import type {
	unstable_MiddlewareFunction,
	unstable_RouterContextProvider,
} from "react-router";

const storage = new AsyncLocalStorage<{
	context: unstable_RouterContextProvider;
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
		() => unstable_RouterContextProvider,
		() => Request,
	];
}
