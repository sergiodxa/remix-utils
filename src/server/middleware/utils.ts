import type { unstable_RouterContextProvider } from "react-router";

export type unstable_MiddlewareGetter<T> = (
	context: Readonly<unstable_RouterContextProvider>,
) => T;
