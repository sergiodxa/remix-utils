/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/use-debounce-fetcher` and `bunx shadcn@latest add @remix-utils/use-debounce-submit`.
 *
 * > [!NOTE]
 * > This depends on `react`, and `react-router`.
 *
 * > [!WARN]
 * > These hooks are marked as deprecated, instead of debouncing at the component-level, do it at the route-level. See https://sergiodxa.com/tutorials/debounce-loaders-and-actions-in-react-router.
 *
 * `useDebounceFetcher` and `useDebounceSubmit` are wrappers of `useFetcher` and `useSubmit` that add debounce support.
 *
 * These hooks are based on [@JacobParis](https://github.com/JacobParis)' [article](https://www.jacobparis.com/content/use-debounce-fetcher).
 *
 * ```tsx
 * import { useDebounceFetcher } from "remix-utils/use-debounce-fetcher";
 *
 * export function Component({ data }) {
 * 	let fetcher = useDebounceFetcher<Type>();
 *
 * 	function handleClick() {
 * 		fetcher.submit(data, { debounceTimeout: 1000 });
 * 	}
 *
 * 	return (
 * 		<button type="button" onClick={handleClick}>
 * 			Do Something
 * 		</button>
 * 	);
 * }
 * ```
 *
 * Usage with `useDebounceSubmit` is similar.
 *
 * ```tsx
 * import { useDebounceSubmit } from "remix-utils/use-debounce-submit";
 *
 * export function Component({ name }) {
 * 	let submit = useDebounceSubmit();
 *
 * 	return (
 * 		<input
 * 			name={name}
 * 			type="text"
 * 			onChange={(event) => {
 * 				submit(event.target.form, {
 * 					navigate: false, // use a fetcher instead of a page navigation
 * 					fetcherKey: name, // cancel any previous fetcher with the same key
 * 					debounceTimeout: 1000,
 * 				});
 * 			}}
 * 			onBlur={() => {
 * 				submit(event.target.form, {
 * 					navigate: false,
 * 					fetcherKey: name,
 * 					debounceTimeout: 0, // submit immediately, canceling any pending fetcher
 * 				});
 * 			}}
 * 		/>
 * 	);
 * }
 * ```
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Hook/Use Debounce Fetcher
 */
import { useCallback, useEffect, useRef } from "react";
import type { FetcherWithComponents, SubmitFunction, SubmitOptions } from "react-router";
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

type DebouncedFetcher<Data = unknown> = Omit<FetcherWithComponents<Data>, "submit"> & {
	submit: DebounceSubmitFunction;
};

/**
 * @deprecated Debounce at the route level instead of the component level.
 * @see https://sergiodxa.com/tutorials/debounce-loaders-and-actions-in-react-router
 */
export function useDebounceFetcher<Data>(opts?: Parameters<typeof useFetcher>[0]) {
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
