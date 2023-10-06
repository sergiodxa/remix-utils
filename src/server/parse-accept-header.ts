/**
 * Given an accept header like `text/html, application/json;q=0.9` it will parse
 * it and return an array of object with the mime-type, subtype and params of
 * each media type.
 * @param header The Accept header value
 * @returns An array of objects with the type, subtype and params of each media type
 */
export function parseAcceptHeader(header: string) {
	let types = header.split(",").map((type) => type.trim());

	let parsedTypes = types.map((value) => {
		let [mediaType, ...params] = value.split(";");

		let [type, subtype] = mediaType.split("/").map((part) => part.trim());

		let parsedParams = Object.fromEntries(
			params.map((param) => param.split("=")),
		);

		return { type, subtype, params: parsedParams };
	});

	return parsedTypes;
}
