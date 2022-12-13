import { useTransition, useFetchers } from "@remix-run/react";
import { useMemo } from "react";

/**
 * Let you know if the app is pending some request, either global transition
 * or some fetcher transition.
 * @returns "idle" | "pending"
 */
export function useGlobalPendingState() {
  let transition = useTransition();
  let fetchers = useFetchers();

  /**
   * This gets the state of every fetcher active on the app and combine it with
   * the state of the global transition (Link and Form), then use them to
   * determine if the app is idle or if it's loading.
   * Here we consider both loading and submitting as loading.
   */
  return useMemo<"idle" | "pending">(
    function getGlobalState() {
      let states = [
        transition.state,
        ...fetchers.map((fetcher) => fetcher.state),
      ];
      if (states.every((state) => state === "idle")) return "idle";
      return "pending";
    },
    [transition.state, fetchers]
  );
}

/**
 * Let you know if the app is submitting some request, either global transition
 * or some fetcher transition.
 * @returns "idle" | "submitting"
 */
export function useGlobalSubmittingState() {
  let transition = useTransition();
  let fetchers = useFetchers();

  return useMemo<"idle" | "submitting">(
    function getGlobalState() {
      let states = [
        transition.state,
        ...fetchers.map((fetcher) => fetcher.state),
      ];
      if (states.every((state) => state !== "submitting")) return "idle";
      return "submitting";
    },
    [transition.state, fetchers]
  );
}

