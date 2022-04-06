import { json as remixJson, redirect } from "@remix-run/server-runtime";

export type ReplacerFunction = (key: string, value: unknown) => unknown;

export type ExtendedResponseInit = ResponseInit & {
  replacer?: ReplacerFunction | undefined;
};

/**
 * @description
 * A wrapper of the `json` function from `remix` which lets you pass a replacer
 * function in the second argument.
 *
 * This helper, will call JSON.stringify against your data with the replacer if
 * defined to let you configure how the data is serialized.
 *
 * @example
 * type LoaderData = { user: { name: string, createdAt: Date } };
 *
 * let replacer: ReplacerFunction = (key: string, value: unknown) => {
 *   if (typeof value !== "Date") return value;
 *   return { __type: "Date", value: value.toISOString() };
 * }
 *
 * let reviver: ReviverFunction = (key: string, value: unknown) => {
 *   if (value.__type === "Date") return new Date(value.value);
 *   return value;
 * }
 *
 * let validator: ValidatorFunction = data => {
 *   return schema.parse(data)
 * }
 *
 *  export let action: ActionFunction = async ({ request }) => {
 *   let user = await getUser(request);
 *   return json<LoaderData>({ user }, { replacer });
 * }
 *
 * export function Screen() {
 *   let { user } = useLoaderData<LoaderData>({ reviver, validator });
 *   return <UserProfile user={user} />;
 * }
 */
export function json<Data>(data: Data, init?: number | ExtendedResponseInit) {
  if (typeof init === "number") {
    return remixJson<string>(JSON.stringify(data), init);
  }

  if (typeof init === "undefined") {
    return remixJson<string>(JSON.stringify(data));
  }

  let { replacer, ...rest } = init;
  return remixJson<string>(JSON.stringify(data, replacer), rest);
}

/**
 * Create a response receiving a JSON object with the status code 201.
 * @example
 * export let action: ActionFunction = async ({ request }) => {
 *   let result = await doSomething(request);
 *   return created(result);
 * }
 */
export function created<Data = unknown>(
  data: Data,
  init?: Omit<ExtendedResponseInit, "status">
) {
  return json(data, { ...init, status: 201 });
}

/**
 * Create a new Response with a redirect set to the URL the user was before.
 * It uses the Referer header to detect the previous URL. It asks for a fallback
 * URL in case the Referer couldn't be found, this fallback should be a URL you
 * may be ok the user to land to after an action even if it's not the same.
 * @example
 * export let action: ActionFunction = async ({ request }) => {
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
 * export let loader: LoaderFunction = async ({ request }) => {
 *   let user = await getUser(request);
 *   throw badRequest<BoundaryData>({ user });
 * }
 */
export function badRequest<Data = unknown>(
  data: Data,
  init?: Omit<ExtendedResponseInit, "status">
) {
  return json<Data>(data, { ...init, status: 400 });
}

/**
 * Create a response receiving a JSON object with the status code 401.
 * @example
 * export let loader: LoaderFunction = async ({ request }) => {
 *   let user = await getUser(request);
 *   throw unauthorized<BoundaryData>({ user });
 * }
 */
export function unauthorized<Data = unknown>(
  data: Data,
  init?: Omit<ExtendedResponseInit, "status">
) {
  return json<Data>(data, { ...init, status: 401 });
}

/**
 * Create a response receiving a JSON object with the status code 403.
 * @example
 * export let loader: LoaderFunction = async ({ request }) => {
 *   let user = await getUser(request);
 *   if (!user.idAdmin) throw forbidden<BoundaryData>({ user });
 * }
 */
export function forbidden<Data = unknown>(
  data: Data,
  init?: Omit<ExtendedResponseInit, "status">
) {
  return json<Data>(data, { ...init, status: 403 });
}

/**
 * Create a response receiving a JSON object with the status code 404.
 * @example
 * export let loader: LoaderFunction = async ({ request, params }) => {
 *   let user = await getUser(request);
 *   if (!db.exists(params.id)) throw notFound<BoundaryData>({ user });
 * }
 */
export function notFound<Data = unknown>(
  data: Data,
  init?: Omit<ExtendedResponseInit, "status">
) {
  return json<Data>(data, { ...init, status: 404 });
}

/**
 * Create a response receiving a JSON object with the status code 422.
 * @example
 * export let loader: LoaderFunction = async ({ request, params }) => {
 *   let user = await getUser(request);
 *   throw unprocessableEntity<BoundaryData>({ user });
 * }
 */
export function unprocessableEntity<Data = unknown>(
  data: Data,
  init?: Omit<ExtendedResponseInit, "status">
) {
  return json<Data>(data, { ...init, status: 422 });
}

/**
 * Create a response receiving a JSON object with the status code 500.
 * @example
 * export let loader: LoaderFunction = async ({ request }) => {
 *   let user = await getUser(request);
 *   throw serverError<BoundaryData>({ user });
 * }
 */
export function serverError<Data = unknown>(
  data: Data,
  init?: Omit<ExtendedResponseInit, "status">
) {
  return json<Data>(data, { ...init, status: 500 });
}

/**
 * Create a response with only the status 304 and optional headers.
 * This is useful when trying to implement conditional responses based on Etags.
 * @example
 * export let loader: LoaderFunction = async ({ request }) => {
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
 * export let loader: LoaderFunction = async ({ request }) => {
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
 * export let loader: LoaderFunction = async ({ request }) => {
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
 * export let loader: LoaderFunction = async ({ request }) => {
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
 * export let loader: LoaderFunction = async ({ request }) => {
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
 * export let loader: LoaderFunction = async ({ request }) => {
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
