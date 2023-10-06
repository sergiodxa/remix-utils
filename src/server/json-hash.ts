import type { TypedResponse } from "@remix-run/server-runtime";

import { json as remixJson } from "@remix-run/server-runtime";

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
): Promise<TypedResponse<ResponseResult<LoaderData>>> {
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

	return remixJson<ResponseResult<LoaderData>>(result, init);
}
