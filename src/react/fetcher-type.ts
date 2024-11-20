import { type Navigation } from "react-router";
import { type FetcherWithComponents, useNavigation } from "react-router";

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
	fetcher: Pick<
		FetcherWithComponents<unknown>,
		"state" | "data" | "formMethod"
	>,
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
