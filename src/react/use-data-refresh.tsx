import { useFetcher } from "@remix-run/react";
import { useCallback, useMemo } from "react";

/**
 * @deprecated Use the `useRevalidator` hook from `@remix-run/react`.
 *
 * Trigger a refresh of the current routes loaders.
 *
 * This work by sending a `POST` request with a fetcher.submit to /dev/null in
 * order to force loaders to run again.
 *
 * You need to create `app/routes/dev/null.ts` and define an action that
 * returns null.
 *
 * It returns also a type and state strings with the process of the refresh.
 *
 * @example
 * let { refresh } = useDataRefresh();
 * return <button type="button" onClick={() => refresh}>Reload</button>;
 */
export function useDataRefresh() {
  let { submit, type, state } = useFetcher();

  let refreshState = useMemo(
    function getRefreshState() {
      if (state === "submitting") return "loading";
      return state;
    },
    [state]
  );

  let refreshType = useMemo(
    function getRefreshType(): "init" | "refreshRedirect" | "refresh" {
      if (type === "init") return "init";
      if (type === "actionRedirect") return "refreshRedirect";
      if (type === "done") return "init";
      return "refresh";
    },
    [type]
  );

  let refresh = useCallback(() => {
    submit(null, { action: "/dev/null", method: "post" });
  }, [submit]);

  return useMemo(() => {
    return { refresh, type: refreshType, state: refreshState };
  }, [refresh, refreshState, refreshType]);
}
