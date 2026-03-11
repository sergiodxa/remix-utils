/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/existing-search-params`.
 *
 * ```ts
 * import { ExistingSearchParams } from "remix-utils/existing-search-params";
 * ```
 *
 * > [!NOTE]
 * > This depends on `react` and `react-router`
 *
 * When you submit a GET form, the browser will replace all of the search params in the URL with your form data. This component copies existing search params into hidden inputs so they will not be overwritten.
 *
 * The `exclude` prop accepts an array of search params to exclude from the hidden inputs
 *
 * - add params handled by this form to this list
 * - add params from other forms you want to clear on submit
 *
 * For example, imagine a table of data with separate form components for pagination and filtering and searching. Changing the page number should not affect the search or filter params.
 *
 * ```tsx
 * <Form>
 * 	<ExistingSearchParams exclude={["page"]} />
 * 	<button type="submit" name="page" value="1">
 * 		1
 * 	</button>
 * 	<button type="submit" name="page" value="2">
 * 		2
 * 	</button>
 * 	<button type="submit" name="page" value="3">
 * 		3
 * 	</button>
 * </Form>
 * ```
 *
 * By excluding the `page` param, from the search form, the user will return to the first page of search result.
 *
 * ```tsx
 * <Form>
 * 	<ExistingSearchParams exclude={["q", "page"]} />
 * 	<input type="search" name="q" />
 * 	<button type="submit">Search</button>
 * </Form>
 * ```
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Component/Existing Search Params
 */
import * as React from "react";
import { useSearchParams } from "react-router";

type Props = {
	/**
	 * These query params will not be included as hidden inputs.
	 *  - add params handled by this form to this list
	 *  - any params from other forms you want to clear on submit
	 */
	exclude?: Array<string | undefined>;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "value" | "type" | "id">;

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
export function ExistingSearchParams({ exclude, ...props }: Props) {
	const [searchParams] = useSearchParams();
	const existingSearchParams = [...searchParams.entries()].filter(
		([key]) => !exclude?.includes(key),
	);

	return (
		<>
			{existingSearchParams.map(([key, value]) => {
				return <input key={`${key}=${value}`} {...props} type="hidden" name={key} value={value} />;
			})}
		</>
	);
}
