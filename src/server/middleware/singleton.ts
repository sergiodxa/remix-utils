import type {
	unstable_MiddlewareFunction,
	unstable_RouterContextProvider,
} from "react-router";
import { unstable_createContext } from "react-router";
import type { unstable_MiddlewareGetter } from "./utils.js";

/**
 * Creates a singleton middleware that creates an instance of a class and stores
 * it in the context. If the instance already exists in the context, it will
 * return the existing instance.
 *
 * @param options - Options for the singleton middleware.
 * @param options.Class - The class to create an instance of.
 * @param options.arguments - Arguments to pass to the class constructor.
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
		instantiator(request: Request, context: unstable_RouterContextProvider): T;
	}

	export type ReturnType<T> = [
		unstable_MiddlewareFunction<unstable_RouterContextProvider>,
		unstable_MiddlewareGetter<T>,
	];
}
