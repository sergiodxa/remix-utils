/**
 * The singleton middleware let's you create a singleton object that will be shared between loaders of a single requests.
 *
 * This is specially useful to share objects that needs to be created only once per request, like a cache, but not shared between requests.
 *
 * ```ts
 * import { unstable_createSingletonMiddleware } from "remix-utils/middleware/singleton";
 *
 * export const [singletonMiddleware, getSingleton] =
 *   unstable_createSingletonMiddleware({
 *     instantiator: () => new MySingletonClass(),
 *   });
 * ```
 *
 * To use it, you need to add it to the `unstable_middleware` array in the route where you want to use it.
 *
 * ```ts
 * import { singletonMiddleware } from "~/middleware/singleton.server";
 * export const unstable_middleware = [singletonMiddleware];
 * ```
 *
 * And you can use the `getSingleton` function in your loaders to get the singleton object.
 *
 * ```ts
 * import { getSingleton } from "~/middleware/singleton.server";
 *
 * export async function loader({ context }: Route.LoaderArgs) {
 *   let singleton = getSingleton(context);
 *   let result = await singleton.method();
 *   // ...
 * }
 * ```
 *
 * The singleton middleware can be created with different classes and arguments, so you can have multiple singletons in the same request.
 *
 * ```ts
 * import { unstable_createSingletonMiddleware } from "remix-utils/middleware/singleton";
 *
 * export const [singletonMiddleware, getSingleton] =
 *   unstable_createSingletonMiddleware({
 *     instantiator: () => new MySingletonClass("arg1", "arg2"),
 *   });
 *
 * export const [anotherSingletonMiddleware, getAnotherSingleton] =
 *   unstable_createSingletonMiddleware({
 *     instantiator: () => new AnotherSingletonClass("arg1", "arg2"),
 *   });
 * ```
 *
 * And use it in a route like this.
 *
 * ```ts
 * import {
 *   singletonMiddleware,
 *   anotherSingletonMiddleware,
 * } from "~/middleware/singleton.server";
 *
 * export const unstable_middleware = [
 *   singletonMiddleware,
 *   anotherSingletonMiddleware,
 * ];
 * ```
 *
 * You can also access the `request` and `context` objects in the `instantiator` function, so you can create the singleton based on the request or context.
 *
 * ```ts
 * import { unstable_createSingletonMiddleware } from "remix-utils/middleware/singleton";
 * import { MySingletonClass } from "~/singleton";
 *
 * export const [singletonMiddleware, getSingleton] =
 *   unstable_createSingletonMiddleware({
 *     instantiator: (request, context) => {
 *       return new MySingletonClass(request, context);
 *     },
 *   });
 * ```
 *
 * This can allows you to create a class that depends on the request, maybe to read the URL or body, or depends on the context, maybe to read the session or some other data.
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Middleware/Singleton
 */
import type {
	unstable_MiddlewareFunction,
	unstable_RouterContextProvider,
} from "react-router";
import { unstable_createContext } from "react-router";
import type { unstable_MiddlewareGetter } from "./utils.js";

/**
 * Creates a singleton middleware that creates an instance of an object and
 * stores it in the context. If the instance already exists in the context, it
 * will return the existing instance.
 *
 * @param options - Options for the singleton middleware.
 * @param options.instantiator - A function that takes the request and context and returns a new instance of the object to be stored in the context.
 * @returns A tuple containing the middleware function and a function to get the
 * singleton instance from the context.
 */
export function unstable_createSingletonMiddleware<T>(
	options: unstable_createSingletonMiddleware.Options<T>,
): unstable_createSingletonMiddleware.ReturnType<T> {
	let singletonContext = unstable_createContext<T | null>(null);

	return [
		async function singletonMiddleware({ request, context }, next) {
			let instance =
				context.get(singletonContext) ?? options.instantiator(request, context);
			context.set(singletonContext, instance);
			return await next();
		},

		function getSingletonInstance(context) {
			let instance = context.get(singletonContext);
			if (!instance) throw new Error("Singleton instance not found");
			return instance;
		},
	];
}

export namespace unstable_createSingletonMiddleware {
	export interface Options<T> {
		instantiator(
			request: Request,
			context: Readonly<unstable_RouterContextProvider>,
		): T;
	}

	export type ReturnType<T> = [
		unstable_MiddlewareFunction<Readonly<unstable_RouterContextProvider>>,
		unstable_MiddlewareGetter<T>,
	];
}
