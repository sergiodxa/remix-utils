import { useEffect, useRef } from "react";
import { useRevalidate } from "..";

interface Options {
  /**
   * Use it to control if revalidation should work or not.
   */
  enabled?: boolean;
}

/**
 * Trigger a revalidation of the current routes loaders in case the user
 * left the page open and comes back to the tab with the page.
 * @example
 * useRevalidateOnWindowFocus({ enabled: true });
 * let data = useLoaderData();
 * // use data here, it will be updated when the user comes back
 */
export function useRevalidateOnWindowFocus({ enabled = true }: Options = {}) {
  let revalidate = useRevalidate();
  let visibilityState = useRef<VisibilityState | null>(null);

  useEffect(
    function revalidateOnVisibilityChange() {
      if (!enabled) return;

      function onVisibilityChange() {
        // if the current visibility state is different than the document one
        // it means one is hidden and the other one is visible
        if (visibilityState.current !== document.visibilityState) {
          // so we save the document one to be the current
          visibilityState.current = document.visibilityState;
          // and if it's visible (the previous was hidden) we revalidate
          if (document.visibilityState === "visible") revalidate();
        }
      }

      window.addEventListener("visibilitychange", onVisibilityChange);

      // set the initial state of the ref
      if (visibilityState.current === null) {
        visibilityState.current = document.visibilityState;
      }

      return function cleanup() {
        window.removeEventListener("visibilitychange", onVisibilityChange);
      };
    },
    [enabled, revalidate]
  );
}
