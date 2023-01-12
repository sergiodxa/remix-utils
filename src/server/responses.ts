import { json, redirect } from "@remix-run/server-runtime";

/**
 * Create a response receiving a JSON object with the status code 201.
 * @example
 * export async function action({ request }: ActionArgs) {
 *   let result = await doSomething(request);
 *   return created(result);
 * }
 */
export function created<Data = unknown>(
  data: Data,
  init?: Omit<ResponseInit, "status">
) {
  return json(data, { ...init, status: 201 });
}

/**
 * Create a new Response with a redirect set to the URL the user was before.
 * It uses the Referer header to detect the previous URL. It asks for a fallback
 * URL in case the Referer couldn't be found, this fallback should be a URL you
 * may be ok the user to land to after an action even if it's not the same.
 * @example
 * export async function action({ request }: ActionArgs) {
 *   await doSomething(request);
 *   // If the user was on `/search?query=something` we redirect to that URL
 *   // but if we couldn't we redirect to `/search`, which is an good enough
 *   // fallback
 *   return redirectBack(request, { fallback: "/search" });
 * }
 */
export function redirectBack(
  request: Request,
  { fallback, ...init }: ResponseInit & { fallback: string }
): Response {
  return redirect(request.headers.get("Referer") ?? fallback, init);
}

/**
 * Create a response receiving a JSON object with the status code 400.
 * @example
 * export async function loader({ request }: LoaderArgs) {
 *   let user = await getUser(request);
 *   throw badRequest<BoundaryData>({ user });
 * }
 */
export function badRequest<Data = unknown>(
  data: Data,
  init?: Omit<ResponseInit, "status">
) {
  return json<Data>(data, { ...init, status: 400 });
}

/**
 * Create a response receiving a JSON object with the status code 401.
 * @example
 * export async function loader({ request }: LoaderArgs) {
 *   let user = await getUser(request);
 *   throw unauthorized<BoundaryData>({ user });
 * }
 */
export function unauthorized<Data = unknown>(
  data: Data,
  init?: Omit<ResponseInit, "status">
) {
  return json<Data>(data, { ...init, status: 401 });
}

/**
 * Create a response receiving a JSON object with the status code 403.
 * @example
 * export async function loader({ request }: LoaderArgs) {
 *   let user = await getUser(request);
 *   if (!user.idAdmin) throw forbidden<BoundaryData>({ user });
 * }
 */
export function forbidden<Data = unknown>(
  data: Data,
  init?: Omit<ResponseInit, "status">
) {
  return json<Data>(data, { ...init, status: 403 });
}

/**
 * Create a response receiving a JSON object with the status code 404.
 * @example
 * export async function loader({ request, params }: LoaderArgs) {
 *   let user = await getUser(request);
 *   if (!db.exists(params.id)) throw notFound<BoundaryData>({ user });
 * }
 */
export function notFound<Data = unknown>(
  data: Data,
  init?: Omit<ResponseInit, "status">
) {
  return json<Data>(data, { ...init, status: 404 });
}

/**
 * Create a response receiving a JSON object with the status code 422.
 * @example
 * export async function loader({ request, params }: LoaderArgs) {
 *   let user = await getUser(request);
 *   throw unprocessableEntity<BoundaryData>({ user });
 * }
 */
export function unprocessableEntity<Data = unknown>(
  data: Data,
  init?: Omit<ResponseInit, "status">
) {
  return json<Data>(data, { ...init, status: 422 });
}

/**
 * Create a response receiving a JSON object with the status code 500.
 * @example
 * export async function loader({ request }: LoaderArgs) {
 *   let user = await getUser(request);
 *   throw serverError<BoundaryData>({ user });
 * }
 */
export function serverError<Data = unknown>(
  data: Data,
  init?: Omit<ResponseInit, "status">
) {
  return json<Data>(data, { ...init, status: 500 });
}

/**
 * Create a response with only the status 304 and optional headers.
 * This is useful when trying to implement conditional responses based on Etags.
 * @example
 * export async function loader({ request }: LoaderArgs) {
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
 * export async function loader({ request }: LoaderArgs) {
 *   return javascript("console.log('Hello World')");
 * }
 */
export function javascript(
  content: string,
  init: number | ResponseInit = {}
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
 * export async function loader({ request }: LoaderArgs) {
 *   return css("body { color: red; }");
 * }
 */
export function stylesheet(
  content: string,
  init: number | ResponseInit = {}
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
 * export async function loader({ request }: LoaderArgs) {
 *   return pdf(await generatePDF(request.formData()));
 * }
 */
export function pdf(
  content: Blob | Buffer | ArrayBuffer,
  init: number | ResponseInit = {}
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
 * export async function loader({ request }: LoaderArgs) {
 *   return html("<h1>Hello World</h1>");
 * }
 */
export function html(
  content: string,
  init: number | ResponseInit = {}
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
  init: number | ResponseInit = {}
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
  init: number | ResponseInit = {}
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
 * export async function loader({ request }: LoaderArgs) {
 *   return image(await takeScreenshot(), { type: "image/avif" });
 * }
 */
export function image(
  content: Buffer | ArrayBuffer | ReadableStream,
  { type, ...init }: ResponseInit & { type: ImageType }
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
