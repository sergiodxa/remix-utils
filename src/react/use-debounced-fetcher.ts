import type {
  SubmitOptions,
  FetcherWithComponents,
  SubmitFunction,
} from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
import { useCallback, useEffect, useRef } from "react";

type SubmitTarget = Parameters<SubmitFunction>["0"];

type DebounceSubmitFunction = (
  /**
   * Specifies the `<form>` to be submitted to the server, a specific
   * `<button>` or `<input type="submit">` to use to submit the form, or some
   * arbitrary data to submit.
   *
   * Note: When using a `<button>` its `name` and `value` will also be
   * included in the form data that is submitted.
   */
  target: SubmitTarget,
  /**
   * Options that override the `<form>`'s own attributes. Required when
   * submitting arbitrary data without a backing `<form>`. Additionally, you
   * can specify a `debounceTimeout` to delay the submission of the data.
   */
  options?: SubmitOptions & { debounceTimeout?: number }
) => void;

type DebouncedFetcher<Data = unknown> = Omit<
  FetcherWithComponents<Data>,
  "submit"
> & {
  submit: DebounceSubmitFunction;
};

export function useDebounceFetcher<Data>() {
  let timeoutRef = useRef<NodeJS.Timeout | undefined>();

  useEffect(() => {
    // no initialize step required since timeoutRef defaults undefined
    let timeout = timeoutRef.current;
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [timeoutRef]);

  let fetcher = useFetcher<Data>() as DebouncedFetcher<Data>;

  fetcher.submit = useCallback(
    (target, { debounceTimeout = 0, ...options } = {}) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (!debounceTimeout || debounceTimeout <= 0) {
        return fetcher.submit(target, options);
      }

      timeoutRef.current = setTimeout(() => {
        fetcher.submit(target, options);
      }, debounceTimeout);
    },
    [fetcher]
  );

  return fetcher;
}
