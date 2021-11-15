import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Trigger a revalidation of the current routes loaders.
 *
 * This work by navigating to the current page, this make Remix run the loaders
 * of the current page again.
 *
 * The hook sets `replace: true` to the navigation options in order to avoid
 * adding new history entries, this will avoid a case when the user clicks on
 * the back button and it remains on the same page instead of going to the real
 * previous page.
 * @example
 * let revalidate = useRevalidate();
 * return <button type="button" onClick={() => revalidate}>Reload</button>;
 */
export function useRevalidate() {
  let navigate = useNavigate();
  return useCallback(() => {
    navigate(".", { replace: true });
  }, [navigate]);
}
