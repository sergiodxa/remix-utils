import { useNavigation, useFetchers, useRevalidator } from "@remix-run/react";
import { useMemo } from "react";

/**
 * This is a helper hook that returns the state of every fetcher active on
 * the app and combine it with the state of the global transition and
 * revalidator.
 * @example
 * let states = useGlobalTransitionStates();
 * if (state.includes("loading")) {
 *   // The app is loading or revalidating.
 * }
 * if (state.includes("submitting")) {
 *   // The app is submitting.
 * }
 * // The app is idle
 */
export function useGlobalTransitionStates() {
  let { state: navigationState } = useNavigation();
  let { state: revalidatorState } = useRevalidator();
  let fetchers = useFetchers();

  /**
   * This gets the state of every fetcher active on the app and combine it with
   * the state of the global transition (Link and Form) and revalidator.
   */
  return useMemo(
    function getGlobalTransitionStates() {
      return [
        navigationState,
        // The type cast here is used to remove RevalidatorState from the union
        revalidatorState as "idle" | "loading",
        ...fetchers.map((fetcher) => fetcher.state),
      ];
    },
    [navigationState, revalidatorState, fetchers]
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
  let states = useGlobalTransitionStates();
  if (states.includes("submitting")) return "submitting";
  return "idle";
}

/**
 * Let you know if the app is loading some request, either global transition
 * or some fetcher transition.
 * @returns "idle" | "loading"
 */
export function useGlobalLoadingState() {
  let states = useGlobalTransitionStates();
  if (states.includes("loading")) return "loading";
  return "idle";
}
