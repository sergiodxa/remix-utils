/**
 * Create a response with only the status 304 and optional headers.
 * This is useful when trying to implement conditional responses based on Etags.
 * @example
 * export async function loader({ request }: LoaderFunctionArgs) {
 *   return notModified();
 * }
 */
export function notModified(init?: Omit<ResponseInit, "status">) {
	return new Response("", { ...init, status: 304 });
}

/**
 * Create a response with a JavaScript file response.
 * It receives a string with the JavaScript content and set the Content-Type
 * header to `application/javascript; charset=utf-8` always.
 *
 * This is useful to dynamically create a JS file from a Resource Route.
 * @example
 * export async function loader({ request }: LoaderFunctionArgs) {
 *   return javascript("console.log('Hello World')");
 * }
 */
export function javascript(
	content: string,
	init: number | ResponseInit = {},
): Response {
	let responseInit = typeof init === "number" ? { status: init } : init;

	let headers = new Headers(responseInit.headers);
	if (!headers.has("Content-Type")) {
		headers.set("Content-Type", "application/javascript; charset=utf-8");
	}

	return new Response(content, {
		...responseInit,
		headers,
	});
}

/**
 * Create a response with a CSS file response.
 * It receives a string with the CSS content and set the Content-Type header to
 * `text/css; charset=utf-8` always.
 *
 * This is useful to dynamically create a CSS file from a Resource Route.
 * @example
 * export async function loader({ request }: LoaderFunctionArgs) {
 *   return css("body { color: red; }");
 * }
 */
export function stylesheet(
	content: string,
	init: number | ResponseInit = {},
): Response {
	let responseInit = typeof init === "number" ? { status: init } : init;

	let headers = new Headers(responseInit.headers);
	if (!headers.has("Content-Type")) {
		headers.set("Content-Type", "text/css; charset=utf-8");
	}

	return new Response(content, {
		...responseInit,
		headers,
	});
}

/**
 * Create a response with a PDF file response.
 * It receives a string with the PDF content and set the Content-Type header to
 * `application/pdf; charset=utf-8` always.
 *
 * This is useful to dynamically create a PDF file from a Resource Route.
 * @example
 * export async function loader({ request }: LoaderFunctionArgs) {
 *   return pdf(await generatePDF(request.formData()));
 * }
 */
export function pdf(
	content: Blob | Buffer | ArrayBuffer,
	init: number | ResponseInit = {},
): Response {
	let responseInit = typeof init === "number" ? { status: init } : init;

	let headers = new Headers(responseInit.headers);
	if (!headers.has("Content-Type")) {
		headers.set("Content-Type", "application/pdf");
	}

	return new Response(content, {
		...responseInit,
		headers,
	});
}

/**
 * Create a response with a HTML file response.
 * It receives a string with the HTML content and set the Content-Type header to
 * `text/html; charset=utf-8` always.
 *
 * This is useful to dynamically create a HTML file from a Resource Route.
 * @example
 * export async function loader({ request }: LoaderFunctionArgs) {
 *   return html("<h1>Hello World</h1>");
 * }
 */
export function html(
	content: string,
	init: number | ResponseInit = {},
): Response {
	let responseInit = typeof init === "number" ? { status: init } : init;

	let headers = new Headers(responseInit.headers);
	if (!headers.has("Content-Type")) {
		headers.set("Content-Type", "text/html; charset=utf-8");
	}

	return new Response(content, {
		...responseInit,
		headers,
	});
}

/**
 * Create a response with a XML file response.
 * It receives a string with the XML content and set the Content-Type header to
 * `application/xml; charset=utf-8` always.
 *
 * This is useful to dynamically create a XML file from a Resource Route.
 * @example
 * export let loader: LoaderFunction = async ({ request }) => {
 *   return xml("<?xml version='1.0'?><catalog></catalog>");
 * }
 */
export function xml(
	content: string,
	init: number | ResponseInit = {},
): Response {
	let responseInit = typeof init === "number" ? { status: init } : init;

	let headers = new Headers(responseInit.headers);
	if (!headers.has("Content-Type")) {
		headers.set("Content-Type", "application/xml; charset=utf-8");
	}

	return new Response(content, {
		...responseInit,
		headers,
	});
}

/**
 * Create a response with a TXT file response.
 * It receives a string with the TXT content and set the Content-Type header to
 * `text/plain; charset=utf-8` always.
 *
 * This is useful to dynamically create a TXT file from a Resource Route.
 * @example
 * export let loader: LoaderFunction = async ({ request }) => {
 *   return txt(`
 *     User-agent: *
 *     Allow: /
 *   `);
 * }
 */
export function txt(
	content: string,
	init: number | ResponseInit = {},
): Response {
	let responseInit = typeof init === "number" ? { status: init } : init;

	let headers = new Headers(responseInit.headers);
	if (!headers.has("Content-Type")) {
		headers.set("Content-Type", "text/plain; charset=utf-8");
	}

	return new Response(content, {
		...responseInit,
		headers,
	});
}

export type ImageType =
	| "image/jpeg"
	| "image/png"
	| "image/gif"
	| "image/svg+xml"
	| "image/webp"
	| "image/bmp"
	| "image/avif";

/**
 * Create a response with a image file response.
 * It receives a Buffer, ArrayBuffer or ReadableStream with the image content
 * and set the Content-Type header to the `type` parameter.
 *
 * This is useful to dynamically create a image file from a Resource Route.
 * @example
 * export async function loader({ request }: LoaderFunctionArgs) {
 *   return image(await takeScreenshot(), { type: "image/avif" });
 * }
 */
export function image(
	content: Buffer | ArrayBuffer | ReadableStream,
	{ type, ...init }: ResponseInit & { type: ImageType },
): Response {
	let headers = new Headers(init.headers);

	if (!headers.has("Content-Type")) {
		headers.set("Content-Type", type);
	}

	return new Response(content, {
		...init,
		headers,
	});
}
