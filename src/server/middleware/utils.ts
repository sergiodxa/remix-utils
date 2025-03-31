import type { unstable_RouterContextProvider } from "react-router";

export type unstable_MiddlewareGetter<T> = (
	context: unstable_RouterContextProvider,
) => T;
