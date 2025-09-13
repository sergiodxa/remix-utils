import type { RouterContextProvider } from "react-router";

export type MiddlewareGetter<T> = (
	context: Readonly<RouterContextProvider>,
) => T;
