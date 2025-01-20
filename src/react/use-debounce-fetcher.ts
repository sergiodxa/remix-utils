import { useCallback, useEffect, useRef } from "react";
import type {
	FetcherWithComponents,
	SubmitFunction,
	SubmitOptions,
} from "react-router";
import { useFetcher } from "react-router";

type SubmitTarget = Parameters<SubmitFunction>["0"];

/**
 * Submits a HTML `<form>` to the server without reloading the page.
 */
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
	options?: SubmitOptions & { debounceTimeout?: number },
) => void;

type DebouncedFetcher<Data = unknown> = Omit<
	FetcherWithComponents<Data>,
	"submit"
> & { submit: DebounceSubmitFunction };

export function useDebounceFetcher<Data>(
	opts?: Parameters<typeof useFetcher>[0],
) {
	let timeoutRef = useRef<Timer>(null);

	useEffect(() => {
		// no initialize step required since timeoutRef defaults undefined
		let timeout = timeoutRef.current;
		return () => {
			if (timeout) clearTimeout(timeout);
		};
	}, []);

	let fetcher = useFetcher<Data>(opts) as DebouncedFetcher<Data>;

	// Clone the original submit to avoid a recursive loop
	const originalSubmit = fetcher.submit;

	fetcher.submit = useCallback(
		(target, { debounceTimeout = 0, ...options } = {}) => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			if (!debounceTimeout || debounceTimeout <= 0) {
				return originalSubmit(target, options);
			}

			timeoutRef.current = setTimeout(() => {
				originalSubmit(target, options);
			}, debounceTimeout);
		},
		[originalSubmit],
	);

	return fetcher;
}
