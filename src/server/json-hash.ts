/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/json-hash`.
 *
 * When returning a `json` from a `loader` function, you may need to get data from different DB queries or API requests, typically you would something like this
 *
 * ```ts
 * export async function loader({ params }: LoaderData) {
 * 	let postId = z.string().parse(params.postId);
 * 	let [post, comments] = await Promise.all([getPost(), getComments()]);
 * 	return json({ post, comments });
 *
 * 	async function getPost() {
 * 		/* … * /
 * 	}
 * 	async function getComments() {
 * 		/* … * /
 * 	}
 * }
 * ```
 *
 * The `jsonHash` function lets you define those functions directly in the `json`, reducing the need to create extra functions and variables.
 *
 * ```ts
 * import { jsonHash } from "remix-utils/json-hash";
 *
 * export async function loader({ params }: LoaderData) {
 * 	let postId = z.string().parse(params.postId);
 * 	return jsonHash({
 * 		async post() {
 * 			// Implement me
 * 		},
 * 		async comments() {
 * 			// Implement me
 * 		},
 * 	});
 * }
 * ```
 *
 * It also calls your functions using `Promise.all` so you can be sure the data is retrieved in parallel.
 *
 * Additionally, you can pass non-async functions, values and promises.
 *
 * ```ts
 * import { jsonHash } from "remix-utils/json-hash";
 *
 * export async function loader({ params }: LoaderData) {
 * 	let postId = z.string().parse(params.postId);
 * 	return jsonHash({
 * 		postId, // value
 * 		comments: getComments(), // Promise
 * 		slug() {
 * 			// Non-async function
 * 			return postId.split("-").at(1); // get slug from postId param
 * 		},
 * 		async post() {
 * 			// Async function
 * 			return await getPost(postId);
 * 		},
 * 	});
 *
 * 	async function getComments() {
 * 		/* … * /
 * 	}
 * }
 * ```
 *
 * The result of `jsonHash` is a `TypedResponse` and it's correctly typed so using it with `typeof loader` works flawlessly.
 *
 * ```ts
 * export default function Component() {
 * 	// all correctly typed
 * 	let { postId, comments, slug, post } = useLoaderData<typeof loader>();
 *
 * 	// more code…
 * }
 * ```
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Server/JSON Hash
 */
import { data } from "react-router";

type ResponseResult<LoaderData> = {
	[Key in keyof LoaderData]: LoaderData[Key] extends () => infer ReturnValue
		? ReturnValue extends PromiseLike<infer Value>
			? Value
			: ReturnValue
		: LoaderData[Key] extends PromiseLike<infer Value>
			? Value
			: LoaderData[Key];
};

export async function jsonHash<LoaderData extends Record<string, unknown>>(
	input: LoaderData,
	init?: ResponseInit | number,
) {
	let result: ResponseResult<LoaderData> = {} as ResponseResult<LoaderData>;

	let resolvedResults = await Promise.all(
		Object.entries(input).map(async ([key, value]) => {
			if (value instanceof Function) value = value();
			if (value instanceof Promise) value = await value;
			return [key, value] as const;
		}),
	);

	for (let [key, value] of resolvedResults) {
		result[key as keyof LoaderData] =
			value as unknown as ResponseResult<LoaderData>[keyof LoaderData];
	}

	return data<ResponseResult<LoaderData>>(result, init);
}
