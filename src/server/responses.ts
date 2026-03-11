/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/responses`.
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/redirect-back`.
 *
 * This function is a wrapper of the `redirect` helper from Remix. Unlike Remix's version, this one receives the whole request object as the first value and an object with the response init and a fallback URL.
 *
 * The response created with this function will have the `Location` header pointing to the `Referer` header from the request, or if not available, the fallback URL provided in the second argument.
 *
 * ```ts
 * import { redirectBack } from "remix-utils/redirect-back";
 *
 * export async function action({ request }: Route.ActionArgs) {
 * 	throw redirectBack(request, { fallback: "/" });
 * }
 * ```
 *
 * This helper is most useful when used in a generic action to send the user to the same URL it was before.
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/responses`.
 *
 * Helper function to create a Not Modified (304) response without a body and any header.
 *
 * ```ts
 * import { notModified } from "remix-utils/responses";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	return notModified();
 * }
 * ```
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/responses`.
 *
 * Helper function to create a JavaScript file response with any header.
 *
 * This is useful to create JS files based on data inside a Resource Route.
 *
 * ```ts
 * import { javascript } from "remix-utils/responses";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	return javascript("console.log('Hello World')");
 * }
 * ```
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/responses`.
 *
 * Helper function to create a CSS file response with any header.
 *
 * This is useful to create CSS files based on data inside a Resource Route.
 *
 * ```ts
 * import { stylesheet } from "remix-utils/responses";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	return stylesheet("body { color: red; }");
 * }
 * ```
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/responses`.
 *
 * Helper function to create a PDF file response with any header.
 *
 * This is useful to create PDF files based on data inside a Resource Route.
 *
 * ```ts
 * import { pdf } from "remix-utils/responses";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	return pdf(await generatePDF(request.formData()));
 * }
 * ```
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/responses`.
 *
 * Helper function to create a HTML file response with any header.
 *
 * This is useful to create HTML files based on data inside a Resource Route.
 *
 * ```ts
 * import { html } from "remix-utils/responses";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	return html("<h1>Hello World</h1>");
 * }
 * ```
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/responses`.
 *
 * Helper function to create a XML file response with any header.
 *
 * This is useful to create XML files based on data inside a Resource Route.
 *
 * ```ts
 * import { xml } from "remix-utils/responses";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	return xml("<?xml version='1.0'?><catalog></catalog>");
 * }
 * ```
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/responses`.
 *
 * Helper function to create a TXT file response with any header.
 *
 * This is useful to create TXT files based on data inside a Resource Route.
 *
 * ```ts
 * import { txt } from "remix-utils/responses";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	return txt(`
 *     User-agent: *
 *     Allow: /
 *   `);
 * }
 * ```
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Server/Responses
 */
/**
 * Create a response with only the status 304 and optional headers.
 * This is useful when trying to implement conditional responses based on Etags.
 * @example
 * export async function loader({ request }: Route.LoaderArgs) {
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
 * export async function loader({ request }: Route.LoaderArgs) {
 *   return javascript("console.log('Hello World')");
 * }
 */
export function javascript(content: string, init: number | ResponseInit = {}): Response {
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
 * export async function loader({ request }: Route.LoaderArgs) {
 *   return css("body { color: red; }");
 * }
 */
export function stylesheet(content: string, init: number | ResponseInit = {}): Response {
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
 * export async function loader({ request }: Route.LoaderArgs) {
 *   return pdf(await generatePDF(request.formData()));
 * }
 */
export function pdf(
	content: BodyInit | null | undefined,
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
 * export async function loader({ request }: Route.LoaderArgs) {
 *   return html("<h1>Hello World</h1>");
 * }
 */
export function html(content: string, init: number | ResponseInit = {}): Response {
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
export function xml(content: string, init: number | ResponseInit = {}): Response {
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
export function txt(content: string, init: number | ResponseInit = {}): Response {
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
 * export async function loader({ request }: Route.LoaderArgs) {
 *   return image(await takeScreenshot(), { type: "image/avif" });
 * }
 */
export function image(
	content: BodyInit | null | undefined,
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
