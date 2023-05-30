import { useTransition, useFetchers, useRevalidator } from "@remix-run/react";
import { useMemo } from "react";

/**
 * This is a helper hook that returns the state of every fetcher active on
 * the app and combine it with the state of the global transition and revalidation state.
 * @example
 * let states = useGlobalTransitionStates();
 * if (state.includes("loading")) {
 *   // The app is loading.
 * }
 * if (state.includes("submitting")) {
 *   // The app is submitting.
 * }
 * // The app is idle
 */
export function useGlobalTransitionStates() {
  let transition = useTransition();
  let fetchers = useFetchers();
  let revalidator = useRevalidator();

  /**
   * This gets the state of every fetcher active on the app and combine it with
   * the state of the global transition (Link and Form).
   */
  return useMemo(
    function getGlobalTransitionStates() {
      return [
        transition.state,
        revalidator.state,
        ...fetchers.map((fetcher) => fetcher.state),
      ];
    },
    [transition.state, fetchers, revalidator.state]
  );
}

/**
 * Let you know if the app is pending some request, either global transition,
 * some fetcher transition or revalidation.
 * @returns "idle" | "pending"
 */
export function useGlobalPendingState() {
  let isSubmitting = useGlobalSubmittingState() === "submitting";
  let isLoading = useGlobalLoadingState() === "loading";
  let isRevalidating = useRevalidator().state === "loading";

  if (isLoading || isSubmitting || isRevalidating) return "pending";
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
 * Let you know if the app is loading some request, either global transition,
 * some fetcher transition or revalidation.
 * @returns "idle" | "loading"
 */
export function useGlobalLoadingState() {
  let states = useGlobalTransitionStates();
  let revalidator = useRevalidator();

  if (revalidator.state === "loading" || states.includes("loading")) {
    return "loading";
  }

  return "idle";
}
