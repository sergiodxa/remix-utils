import * as React from "react";
import { useSearchParams } from "@remix-run/react";

type Props = {
	/**
	 * These query params will not be included as hidden inputs.
	 *  - add params handled by this form to this list
	 *  - any params from other forms you want to clear on submit
	 */
	exclude?: Array<string | undefined>;
};

/**
 * Include existing query params as hidden inputs in a form.
 *
 * @example
 * A pagination bar that does not clear the search query
 * ```tsx
 * <Form>
 *   <ExistingSearchParams exclude={['page']} />
 *   <button type="submit" name="page" value="1">1</button>
 *   <button type="submit" name="page" value="2">2</button>
 *   <button type="submit" name="page" value="3">3</button>
 * </Form>
 * ```
 *
 * @example
 * A search form that clears the page param
 * ```tsx
 * <Form>
 *   <ExistingSearchParams exclude={['q', 'page']} />
 *   <input type="search" name="q" />
 * </Form>
 * ```
 */
export function ExistingSearchParams({ exclude }: Props) {
	const [searchParams] = useSearchParams();
	const existingSearchParams = [...searchParams.entries()].filter(
		([key]) => !exclude?.includes(key),
	);

	return (
		<>
			{existingSearchParams.map(([key, value]) => {
				return (
					<input
						key={`${key}=${value}`}
						type="hidden"
						name={key}
						value={value}
					/>
				);
			})}
		</>
	);
}
