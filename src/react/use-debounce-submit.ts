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
 * @module Hook/Use Debounce Submit
 */
import { useCallback, useEffect, useRef } from "react";
import type { SubmitFunction, SubmitOptions } from "react-router";
import { useSubmit } from "react-router";

type SubmitTarget = Parameters<SubmitFunction>["0"];

/**
 * @deprecated Debounce at the route level instead of the component level.
 * @see https://sergiodxa.com/tutorials/debounce-loaders-and-actions-in-react-router
 */
export function useDebounceSubmit() {
	let timeoutRef = useRef<Timer | undefined>(null);

	useEffect(() => {
		// no initialize step required since timeoutRef defaults undefined
		let timeout = timeoutRef.current;
		return () => {
			if (timeout) clearTimeout(timeout);
		};
	}, []);

	// Clone the original submit to avoid a recursive loop
	const originalSubmit = useSubmit();

	const submit = useCallback(
		(
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
			options?: SubmitOptions & {
				/** Submissions within this timeout will be canceled */
				debounceTimeout?: number;
			},
		) => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			if (!options?.debounceTimeout || options.debounceTimeout <= 0) {
				return originalSubmit(target, options);
			}

			return new Promise<void>((resolve) => {
				timeoutRef.current = setTimeout(() => {
					resolve(originalSubmit(target, options));
				}, options.debounceTimeout);
			});
		},
		[originalSubmit],
	);

	return submit;
}
