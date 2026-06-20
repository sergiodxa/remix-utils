/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/use-global-navigation-state`.
 *
 * > [!NOTE]
 * > This depends on `react`, and `react-router`.
 *
 * This hook allows you to read the value of `transition.state`, every `fetcher.state` in the app, and `revalidator.state`.
 *
 * ```ts
 * import { useGlobalNavigationState } from "remix-utils/use-global-navigation-state";
 *
 * export function GlobalPendingUI() {
 * 	let states = useGlobalNavigationState();
 *
 * 	if (state.includes("loading")) {
 * 		// The app is loading.
 * 	}
 *
 * 	if (state.includes("submitting")) {
 * 		// The app is submitting.
 * 	}
 *
 * 	// The app is idle
 * }
 * ```
 *
 * The return value of `useGlobalNavigationState` can be `"idle"`, `"loading"` or `"submitting"`
 *
 * > [!NOTE]
 * > This is used by the hooks below to determine if the app is loading, submitting or both (pending).
 *
 * ---
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/use-global-navigation-state`.
 *
 * > [!NOTE]
 * > This depends on `react`, and `react-router`.
 *
 * This hook lets you know if the global navigation, if one of any active fetchers is either loading or submitting, or if the revalidator is running.
 *
 * ```ts
 * import { useGlobalPendingState } from "remix-utils/use-global-navigation-state";
 *
 * export function GlobalPendingUI() {
 *   let globalState = useGlobalPendingState();
 *
 *   if (globalState === "idle") return null;
 *   return <Spinner />;
 * }
 * ```
 *
 * The return value of `useGlobalPendingState` is either `"idle"` or `"pending"`.
 *
 * > [!NOTE]
 * > This hook combines the `useGlobalSubmittingState` and `useGlobalLoadingState` hooks to determine if the app is pending.
 *
 * > [!NOTE]
 * > The `pending` state is a combination of the `loading` and `submitting` states introduced by this hook.
 *
 * ---
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/use-global-navigation-state`.
 *
 * > [!NOTE]
 * > This depends on `react`, and `react-router`.
 *
 * This hook lets you know if the global transition or if one of any active fetchers is submitting.
 *
 * ```ts
 * import { useGlobalSubmittingState } from "remix-utils/use-global-navigation-state";
 *
 * export function GlobalPendingUI() {
 *   let globalState = useGlobalSubmittingState();
 *
 *   if (globalState === "idle") return null;
 *   return <Spinner />;
 * }
 * ```
 *
 * The return value of `useGlobalSubmittingState` is either `"idle"` or `"submitting"`.
 *
 * ---
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/use-global-navigation-state`.
 *
 * > [!NOTE]
 * > This depends on `react`, and `react-router`.
 *
 * This hook lets you know if the global transition, if one of any active fetchers is loading, or if the revalidator is running
 *
 * ```ts
 * import { useGlobalLoadingState } from "remix-utils/use-global-navigation-state";
 *
 * export function GlobalPendingUI() {
 *   let globalState = useGlobalLoadingState();
 *
 *   if (globalState === "idle") return null;
 *   return <Spinner />;
 * }
 * ```
 *
 * The return value of `useGlobalLoadingState` is either `"idle"` or `"loading"`.
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Hook/Use Global Navigation State
 */
import { useMemo } from "react";
import { useFetchers, useNavigation, useRevalidator } from "react-router";

/**
 * This is a helper hook that returns the state of every fetcher active on
 * the app and combine it with the state of the global transition and
 * revalidator.
 * @example
 * let states = useGlobalNavigationState();
 * if (state.includes("loading")) {
 *   // The app is loading or revalidating.
 * }
 * if (state.includes("submitting")) {
 *   // The app is submitting.
 * }
 * // The app is idle
 */
export function useGlobalNavigationState() {
	let { state: navigationState } = useNavigation();
	let { state: revalidatorState } = useRevalidator();
	let fetchers = useFetchers();

	/**
	 * This gets the state of every fetcher active on the app and combine it with
	 * the state of the global transition (Link and Form) and revalidator.
	 */
	return useMemo(
		function getGlobalNavigationState() {
			return [
				navigationState,
				// The type cast here is used to remove RevalidatorState from the union
				revalidatorState as "idle" | "loading",
				...fetchers.map((fetcher) => fetcher.state),
			];
		},
		[navigationState, revalidatorState, fetchers],
	);
}

/**
 * Let you know if the app is pending some request, either global transition
 * or some fetcher transition.
 * @returns "idle" | "pending"
 */
export function useGlobalPendingState() {
	let isSubmitting = useGlobalSubmittingState() === "submitting";
	let isLoading = useGlobalLoadingState() === "loading";

	if (isLoading || isSubmitting) return "pending";
	return "idle";
}

/**
 * Let you know if the app is submitting some request, either global transition
 * or some fetcher transition.
 * @returns "idle" | "submitting"
 */
export function useGlobalSubmittingState() {
	let states = useGlobalNavigationState();
	if (states.includes("submitting")) return "submitting";
	return "idle";
}

/**
 * Let you know if the app is loading some request, either global transition
 * or some fetcher transition.
 * @returns "idle" | "loading"
 */
export function useGlobalLoadingState() {
	let states = useGlobalNavigationState();
	if (states.includes("loading")) return "loading";
	return "idle";
}
