/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/fetcher-type`.
 *
 * > [!NOTE]
 * > This depends on `@remix-route/react`.
 *
 * Derive the value of the deprecated `fetcher.type` from the fetcher and navigation data.
 *
 * ```ts
 * import { getFetcherType } from "remix-utils/fetcher-type";
 *
 * function Component() {
 * 	let fetcher = useFetcher();
 * 	let navigation = useNavigation();
 * 	let fetcherType = getFetcherType(fetcher, navigation);
 * 	useEffect(() => {
 * 		if (fetcherType === "done") {
 * 			// do something once the fetcher is done submitting the data
 * 		}
 * 	}, [fetcherType]);
 * }
 * ```
 *
 * You can also use the React Hook API which let's you avoid calling `useNavigation`.
 *
 * ```ts
 * import { useFetcherType } from "remix-utils/fetcher-type";
 *
 * function Component() {
 * 	let fetcher = useFetcher();
 * 	let fetcherType = useFetcherType(fetcher);
 * 	useEffect(() => {
 * 		if (fetcherType === "done") {
 * 			// do something once the fetcher is done submitting the data
 * 		}
 * 	}, [fetcherType]);
 * }
 * ```
 *
 * If you need to pass the fetcher type around, you can also import `FetcherType` type.
 *
 * ```ts
 * import { type FetcherType } from "remix-utils/fetcher-type";
 *
 * function useCallbackOnDone(type: FetcherType, cb) {
 * 	useEffect(() => {
 * 		if (type === "done") cb();
 * 	}, [type, cb]);
 * }
 * ```
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Hook/Fetcher Type
 */
import { type FetcherWithComponents, type Navigation, useNavigation } from "react-router";

/**
 * The list of types a fetcher can have
 */
export type FetcherType =
	| "init"
	| "done"
	| "actionSubmission"
	| "actionReload"
	| "actionRedirect"
	| "loaderSubmission"
	| "normalLoad";

/**
 * Derive the deprecated `fetcher.type` from the current state of a fetcher.
 * @param fetcher The `fetcher` object returned form `useFetcher`
 * @example
 * let fetcher = useFetcher();
 * let fetcherType = useFetcherType(fetcher);
 * useEffect(() => {
 *   if (fetcherType === "done") // do something once fetcher is done
 * }, [fetcherType]);
 */
export function useFetcherType(fetcher: FetcherWithComponents<unknown>) {
	let navigation = useNavigation();
	return getFetcherType(fetcher, navigation);
}

/**
 * Derive the deprecated `fetcher.type` from the current state of a fetcher
 * and navigation.
 * @param fetcher The `fetcher` object returned form `useFetcher`
 * @param navigation The `Navigation` object returned from `useNavigation`
 * @example
 * let fetcher = useFetcher();
 * let navigation = useNavigation();
 * let fetcherType = getFetcherType(fetcher, navigation);
 * useEffect(() => {
 *   if (fetcherType === "done") // do something once fetcher is done
 * }, [fetcherType])
 */
export function getFetcherType(
	fetcher: Pick<FetcherWithComponents<unknown>, "state" | "data" | "formMethod">,
	navigation: Pick<Navigation, "formMethod" | "state">,
): FetcherType {
	if (fetcher.state === "idle" && fetcher.data != null) return "done";

	if (fetcher.state === "submitting") return "actionSubmission";

	if (
		fetcher.state === "loading" &&
		fetcher.formMethod != null &&
		navigation.formMethod !== "GET" &&
		fetcher.data != null
	) {
		return "actionReload";
	}

	if (
		fetcher.state === "loading" &&
		fetcher.formMethod != null &&
		navigation.formMethod !== "GET" &&
		fetcher.data == null
	) {
		return "actionRedirect";
	}

	if (navigation.state === "loading" && navigation.formMethod === "GET") {
		return "loaderSubmission";
	}

	if (navigation.state === "loading" && navigation.formMethod == null) {
		return "normalLoad";
	}

	return "init";
}
