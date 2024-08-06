# Remix Utils

This package contains simple utility functions to use with [Remix.run](https://remix.run).

## Installation

```bash
npm install remix-utils
```

Additional optional dependencies may be needed, all optional dependencies are:

- `@remix-run/react` (also `@remix-run/router` but you should be using the React one)
- `@remix-run/node` or `@remix-run/cloudflare` or `@remix-run/deno` (actually it's `@remix-run/server-runtime` but you should use one of the others)
- `crypto-js`
- `is-ip`
- `intl-parse-accept-language`
- `react`
- `zod`

The utils that require an extra optional dependency mention it in their documentation.

If you want to install them all run:

```sh
npm add crypto-js is-ip intl-parse-accept-language zod
```

React and the `@remix-run/*` packages should be already installed in your project.

## Upgrade from Remix Utils v6

If you used Remix Utils before, you will notice some changes.

1. The package is published as ESM only
2. Every util now has a specific path in the package, so you need to import them from `remix-utils/<util-name>`.
3. All dependencies are now optional, so you need to install them yourself.

#### Usage with CJS

Since v7 of Remix Utils the package is published as ESM-only (plus type definitions). This means if you're using Remix with CJS you need to configure it to bundle Remix Utils.

In your `remix.config.js` file, add this:

```js
module.exports = {
	serverDependenciesToBundle: [
		/^remix-utils.*/,
		// If you installed is-ip optional dependency you will need these too
		"is-ip",
		"ip-regex",
		"super-regex",
		"clone-regexp",
		"function-timeout",
		"time-span",
		"convert-hrtime",
		"is-regexp",
	],
};
```

If you're not sure if your app uses ESM or CJS, check if you have `serverModuleFormat` in your `remix.config.js` file to know.

In case you don't have one, if you're using Remix v1 it will be CJS and if you're using Remix v2 it will be ESM.

If you're using Vite, but still building to CJS, you will need to [add this package to `noExternal`](https://remix.run/docs/en/main/future/vite#esm--cjs), so it's bundled with your server code. Therefore, add the following to `defineConfig()` in `vite.config.ts`:

```js
ssr: {
      noExternal: ["remix-utils"],
    },
```

> **Note**
> Some of the optional dependencies in Remix Utils may still be published as CJS, so you may need to add them to `serverDependenciesToBundle` too.

Another thing to consider if you did the upgrade from Remix v1 to Remix v2 is that in your `tsconfig.json` you will need to set `"moduleResolution": "Bundler"`, otherwise TS will not resolve the new import paths.

#### Updated Import Paths

You will need to change your imports to use the correct one. So instead of doing:

```ts
import { eventStream, useEventSource } from "remix-utils";
```

You need to change it to:

```ts
import { eventStream } from "remix-utils/sse/server";
import { useEventSource } from "remix-utils/sse/react";
```

This adds more lines but enables the next change.

#### Optional Dependencies

Before, Remix Utils installed some dependencies like Zod that you may never used.

Current version marks every dependency as optional, so you need to install them yourself.

While this is more works it means the package can keep using more dependencies as needed without increasing the bundle size for everyone. Only if you use the dependency that depends on Zod you will install and include Zod in your bundle.

Every util mentions what dependencies it requires and the [Installation](#installation) section mentions the whole list in case you want to install them all upfront.

## API Reference

### promiseHash

The `promiseHash` function is not directly related to Remix but it's a useful function when working with loaders and actions.

This function is an object version of `Promise.all` which lets you pass an object with promises and get an object with the same keys with the resolved values.

```ts
import { promiseHash } from "remix-utils/promise";

export async function loader({ request }: LoaderFunctionArgs) {
	return json(
		await promiseHash({
			user: getUser(request),
			posts: getPosts(request),
		}),
	);
}
```

You can use nested `promiseHash` to get a nested object with resolved values.

```ts
import { promiseHash } from "remix-utils/promise";

export async function loader({ request }: LoaderFunctionArgs) {
	return json(
		await promiseHash({
			user: getUser(request),
			posts: promiseHash({
				list: getPosts(request),
				comments: promiseHash({
					list: getComments(request),
					likes: getLikes(request),
				}),
			}),
		}),
	);
}
```

### timeout

The `timeout` function lets you attach a timeout to any promise, if the promise doesn't resolve or reject before the timeout, it will reject with a `TimeoutError`.

```ts
import { timeout } from "remix-utils/promise";

try {
	let result = await timeout(fetch("https://example.com"), { ms: 100 });
} catch (error) {
	if (error instanceof TimeoutError) {
		// Handle timeout
	}
}
```

Here the fetch needs to happen in less than 100ms, otherwise it will throw a `TimeoutError`.

If the promise is cancellable with an AbortSignal you can pass the AbortController to the `timeout` function.

```ts
import { timeout } from "remix-utils/promise";

try {
	let controller = new AbortController();
	let result = await timeout(
		fetch("https://example.com", { signal: controller.signal }),
		{ ms: 100, controller },
	);
} catch (error) {
	if (error instanceof TimeoutError) {
		// Handle timeout
	}
}
```

Here after 100ms, `timeout` will call `controller.abort()` which will mark the `controller.signal` as aborted.

### cacheAssets

> **Note**
> This can only be run inside `entry.client`.

This function lets you easily cache inside the [browser's Cache Storage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage) every JS file built by Remix.

To use it, open your `entry.client` file and add this:

```ts
import { cacheAssets } from "remix-utils/cache-assets";

cacheAssets().catch((error) => {
	// do something with the error, or not
});
```

The function receives an optional options object with two options:

- `cacheName` is the name of the [Cache object](https://developer.mozilla.org/en-US/docs/Web/API/Cache) to use, the default value is `assets`.
- `buildPath` is the pathname prefix for all Remix built assets, the default value is `/build/` which is the default build path of Remix itself.

It's important that if you changed your build path in `remix.config.js` you pass the same value to `cacheAssets` or it will not find your JS files.

The `cacheName` can be left as is unless you're adding a Service Worker to your app and want to share the cache.

```ts
import { cacheAssets } from "remix-utils/cache-assets";

cacheAssests({ cacheName: "assets", buildPath: "/build/" }).catch((error) => {
	// do something with the error, or not
});
```

### ClientOnly

> **Note**
> This depends on `react`.

The ClientOnly component lets you render the children element only on the client-side, avoiding rendering it the server-side.

You can provide a fallback component to be used on SSR, and while optional, it's highly recommended to provide one to avoid content layout shift issues.

```tsx
import { ClientOnly } from "remix-utils/client-only";

export default function Component() {
	return (
		<ClientOnly fallback={<SimplerStaticVersion />}>
			{() => <ComplexComponentNeedingBrowserEnvironment />}
		</ClientOnly>
	);
}
```

This component is handy when you have some complex component that needs a browser environment to work, like a chart or a map. This way, you can avoid rendering it server-side and instead use a simpler static version like an SVG or even a loading UI.

The rendering flow will be:

- SSR: Always render the fallback.
- CSR First Render: Always render the fallback.
- CSR Update: Update to render the actual component.
- CSR Future Renders: Always render the actual component, don't bother to render the fallback.

This component uses the `useHydrated` hook internally.

### ServerOnly

> **Note**
> This depends on `react`.

The ServerOnly component is the opposite of the ClientOnly component, it lets you render the children element only on the server-side, avoiding rendering it the client-side.

You can provide a fallback component to be used on CSR, and while optional, it's highly recommended to provide one to avoid content layout shift issues, unless you only render visually hidden elements.

```tsx
import { ServerOnly } from "remix-utils/server-only";

export default function Component() {
	return (
		<ServerOnly fallback={<ComplexComponentNeedingBrowserEnvironment />}>
			{() => <SimplerStaticVersion />}
		</ServerOnly>
	);
}
```

This component is handy to render some content only on the server-side, like a hidden input you can later use to know if JS has loaded.

Consider it like the `<noscript>` HTML tag but it can work even if JS failed to load but it's enabled on the browser.

The rendering flow will be:

- SSR: Always render the children.
- CSR First Render: Always render the children.
- CSR Update: Update to render the fallback component (if defined).
- CSR Future Renders: Always render the fallback component, don't bother to render the children.

This component uses the `useHydrated` hook internally.

### CORS

The CORS function let you implement CORS headers on your loaders and actions so you can use them as an API for other client-side applications.

There are two main ways to use the `cors` function.

1. Use it on each loader/action where you want to enable it.
2. Use it globally on entry.server handleRequest and handleDataRequest export.

If you want to use it on every loader/action, you can do it like this:

```ts
import { cors } from "remix-utils/cors";

export async function loader({ request }: LoaderFunctionArgs) {
	let data = await getData(request);
	let response = json<LoaderData>(data);
	return await cors(request, response);
}
```

You could also do the `json` and `cors` call in one line.

```ts
import { cors } from "remix-utils/cors";

export async function loader({ request }: LoaderFunctionArgs) {
	let data = await getData(request);
	return await cors(request, json<LoaderData>(data));
}
```

And because `cors` mutates the response, you can also call it and later return.

```ts
import { cors } from "remix-utils/cors";

export async function loader({ request }: LoaderFunctionArgs) {
	let data = await getData(request);
	let response = json<LoaderData>(data);
	await cors(request, response); // this mutates the Response object
	return response; // so you can return it here
}
```

If you want to setup it globally once, you can do it like this in `entry.server`

```tsx
import { cors } from "remix-utils/cors";

const ABORT_DELAY = 5000;

export default function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext,
) {
	let callbackName = isbot(request.headers.get("user-agent"))
		? "onAllReady"
		: "onShellReady";

	return new Promise((resolve, reject) => {
		let didError = false;

		let { pipe, abort } = renderToPipeableStream(
			<RemixServer context={remixContext} url={request.url} />,
			{
				[callbackName]: () => {
					let body = new PassThrough();

					responseHeaders.set("Content-Type", "text/html");

					cors(
						request,
						new Response(body, {
							headers: responseHeaders,
							status: didError ? 500 : responseStatusCode,
						}),
					).then((response) => {
						resolve(response);
					});

					pipe(body);
				},
				onShellError: (err: unknown) => {
					reject(err);
				},
				onError: (error: unknown) => {
					didError = true;

					console.error(error);
				},
			},
		);

		setTimeout(abort, ABORT_DELAY);
	});
}

export let handleDataRequest: HandleDataRequestFunction = async (
	response,
	{ request },
) => {
	return await cors(request, response);
};
```

#### Options

Additionally, the `cors` function accepts a `options` object as a third optional argument. These are the options.

- `origin`: Configures the **Access-Control-Allow-Origin** CORS header.
  Possible values are:
  - `true`: Enable CORS for any origin (same as "\*")
  - `false`: Don't setup CORS
  - `string`: Set to a specific origin, if set to "\*" it will allow any origin
  - `RegExp`: Set to a RegExp to match against the origin
  - `Array<string | RegExp>`: Set to an array of origins to match against the
    string or RegExp
  - `Function`: Set to a function that will be called with the request origin
    and should return a boolean indicating if the origin is allowed or not.
    The default value is `true`.
- `methods`: Configures the **Access-Control-Allow-Methods** CORS header.
  The default value is `["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"]`.
- `allowedHeaders`: Configures the **Access-Control-Allow-Headers** CORS header.
- `exposedHeaders`: Configures the **Access-Control-Expose-Headers** CORS header.
- `credentials`: Configures the **Access-Control-Allow-Credentials** CORS header.
- `maxAge`: Configures the **Access-Control-Max-Age** CORS header.

### CSRF

> **Note**
> This depends on `react`, `crypto-js`, and a Remix server runtime.

The CSRF related functions let you implement CSRF protection on your application.

This part of Remix Utils needs React and server-side code.

First create a new CSRF instance.

```ts
// app/utils/csrf.server.ts
import { CSRF } from "remix-utils/csrf/server";
import { createCookie } from "@remix-run/node"; // or cloudflare/deno

export const cookie = createCookie("csrf", {
	path: "/",
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax",
	secrets: ["s3cr3t"],
});

export const csrf = new CSRF({
	cookie,
	// what key in FormData objects will be used for the token, defaults to `csrf`
	formDataKey: "csrf",
	// an optional secret used to sign the token, recommended for extra safety
	secret: "s3cr3t",
});
```

Then you can use `csrf` to generate a new token.

```ts
import { csrf } from "~/utils/csrf.server";

export async function loader({ request }: LoaderFunctionArgs) {
	let token = csrf.generate();
}
```

You can customize the token size by passing the byte size, the default one is 32 bytes which will give you a string with a length of 43 after encoding.

```ts
let token = csrf.generate(64); // customize token length
```

You will need to save this token in a cookie and also return it from the loader. For convenience, you can use the `CSRF#commitToken` helper.

```ts
import { csrf } from "~/utils/csrf.server";

export async function loader({ request }: LoaderFunctionArgs) {
	let [token, cookieHeader] = await csrf.commitToken();
	return json({ token }, { headers: { "set-cookie": cookieHeader } });
}
```

> **Note**
> You could do this on any route, but I recommend you to do it on the `root` loader.

Now that you returned the token and set it in a cookie, you can use the `AuthenticityTokenProvider` component to provide the token to your React components.

```tsx
import { AuthenticityTokenProvider } from "remix-utils/csrf/react";

let { csrf } = useLoaderData<LoaderData>();
return (
	<AuthenticityTokenProvider token={csrf}>
		<Outlet />
	</AuthenticityTokenProvider>
);
```

Render it in your `root` component and wrap the `Outlet` with it.

When you create a form in some route, you can use the `AuthenticityTokenInput` component to add the authenticity token to the form.

```tsx
import { Form } from "@remix-run/react";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

export default function Component() {
	return (
		<Form method="post">
			<AuthenticityTokenInput />
			<input type="text" name="something" />
		</Form>
	);
}
```

Note that the authenticity token is only really needed for a form that mutates the data somehow. If you have a search form making a GET request, you don't need to add the authenticity token there.

This `AuthenticityTokenInput` will get the authenticity token from the `AuthenticityTokenProvider` component and add it to the form as the value of a hidden input with the name `csrf`. You can customize the field name using the `name` prop.

```tsx
<AuthenticityTokenInput name="customName" />
```

You should only customize the name if you also changed it on `createAuthenticityToken`.

If you need to use `useFetcher` (or `useSubmit`) instead of `Form` you can also get the authenticity token with the `useAuthenticityToken` hook.

```tsx
import { useFetcher } from "@remix-run/react";
import { useAuthenticityToken } from "remix-utils/csrf/react";

export function useMarkAsRead() {
	let fetcher = useFetcher();
	let csrf = useAuthenticityToken();
	return function submit(data) {
		fetcher.submit(
			{ csrf, ...data },
			{ action: "/api/mark-as-read", method: "post" },
		);
	};
}
```

Finally, you need to validate the authenticity token in the action that received the request.

```ts
import { CSRFError } from "remix-utils/csrf/server";
import { redirectBack } from "remix-utils/redirect-back";
import { csrf } from "~/utils/csrf.server";

export async function action({ request }: ActionFunctionArgs) {
	try {
		await csrf.validate(request);
	} catch (error) {
		if (error instanceof CSRFError) {
			// handle CSRF errors
		}
		// handle other possible errors
	}

	// here you know the request is valid
	return redirectBack(request, { fallback: "/fallback" });
}
```

If you need to parse the body as FormData yourself (e.g. to support file uploads) you can also call `CSRF#validate` with the FormData and Headers objects.

```ts
let formData = await parseMultiPartFormData(request);
try {
	await csrf.validate(formData, request.headers);
} catch (error) {
	// handle errors
}
```

> **Warning**
> If you call `CSRF#validate` with the request instance, but you already read its body, it will throw an error.

In case the CSRF validation fails, it will throw a `CSRFError` which can be used to correctly identify it against other possible errors that may get thrown.

The list of possible error messages are:

- `missing_token_in_cookie`: The request is missing the CSRF token in the cookie.
- `invalid_token_in_cookie`: The CSRF token is not valid (is not a string).
- `tampered_token_in_cookie`: The CSRF token doesn't match the signature.
- `missing_token_in_body`: The request is missing the CSRF token in the body (FormData).
- `mismatched_token`: The CSRF token in the cookie and the body don't match.

You can use `error.code` to check one of the error codes above, and `error.message` to get a human friendly description.

> **Warning**
> Don't send those error messages to the end-user, they are meant to be used for debugging purposes only.

### Existing Search Params

```ts
import { ExistingSearchParams } from "remix-utils/existing-search-params";
```

> **Note**
> This depends on `react` and `@remix-run/react`

When you submit a GET form, the browser will replace all of the search params in the URL with your form data. This component copies existing search params into hidden inputs so they will not be overwritten.

The `exclude` prop accepts an array of search params to exclude from the hidden inputs

- add params handled by this form to this list
- add params from other forms you want to clear on submit

For example, imagine a table of data with separate form components for pagination and filtering and searching. Changing the page number should not affect the search or filter params.

```tsx
<Form>
	<ExistingSearchParams exclude={["page"]} />
	<button type="submit" name="page" value="1">
		1
	</button>
	<button type="submit" name="page" value="2">
		2
	</button>
	<button type="submit" name="page" value="3">
		3
	</button>
</Form>
```

By excluding the `page` param, from the search form, the user will return to the first page of search result.

```tsx
<Form>
	<ExistingSearchParams exclude={["q", "page"]} />
	<input type="search" name="q" />
	<button type="submit">Search</button>
</Form>
```

### External Scripts

> **Note**
> This depends on `react`, `@remix-run/react`, and a Remix server runtime.

If you need to load different external scripts on certain routes, you can use the `ExternalScripts` component together with the `ExternalScriptsFunction` and `ScriptDescriptor` types.

In the route you want to load the script add a `handle` export with a `scripts` method, type the `handle` to be `ExternalScriptsHandle`. This interface is let's you define `scripts` as either a function or an array.

If you want to define what scripts to load based on the loader data, you can use `scripts` as a function:

```ts
import { ExternalScriptsHandle } from "remix-utils/external-scripts";

type LoaderData = SerializeFrom<typeof loader>;

export let handle: ExternalScriptsHandle<LoaderData> = {
  scripts({ id, data, params, matches, location, parentsData }) {
    return [
      {
        src: "https://unpkg.com/htmx.org@1.9.6",
        integrity: "sha384-FhXw7b6AlE/jyjlZH5iHa/tTe9EpJ1Y55RjcgPbjeWMskSxZt1v9qkxLJWNJaGni",
        crossOrigin: 'anonymous"
      }
    ];
  },
};
```

If the list of scripts to load is static you can define `scripts` as an array directly.

```ts
import { ExternalScriptsHandle } from "remix-utils/external-scripts";

export let handle: ExternalScriptsHandle = {
  scripts: [
    {
      src: "https://unpkg.com/htmx.org@1.9.6",
      integrity: "sha384-FhXw7b6AlE/jyjlZH5iHa/tTe9EpJ1Y55RjcgPbjeWMskSxZt1v9qkxLJWNJaGni",
      crossOrigin: 'anonymous",
      preload: true, // use it to render a <link rel="preload"> for this script
    }
  ],
};
```

You can also import `ExternalScriptsFunction` and `ScriptDescriptor` interfaces yourself to build a custom handle type.

```ts
import {
	ExternalScriptsFunction,
	ScriptDescriptor,
} from "remix-utils/external-scripts";

interface AppHandle<LoaderData = unknown> {
	scripts?: ExternalScriptsFunction<LoaderData> | ScriptDescriptor[];
}

export let handle: AppHandle<LoaderData> = {
	scripts, // define scripts as a function or array here
};
```

Or you can extend the `ExternalScriptsHandle` interface.

```ts
import { ExternalScriptsHandle } from "remix-utils/external-scripts";

interface AppHandle<LoaderData = unknown>
	extends ExternalScriptsHandle<LoaderData> {
	// more handle properties here
}

export let handle: AppHandle<LoaderData> = {
	scripts, // define scripts as a function or array here
};
```

---

Then, in the root route, add the `ExternalScripts` component somewhere, usually you want to load it either inside `<head>` or at the bottom of `<body>`, either before or after the Remix's `<Scripts>` component.

Where exactly to place `<ExternalScripts />` will depend on your app, but a safe place is at the end of `<body>`.

```tsx
import { Links, LiveReload, Meta, Scripts, ScrollRestoration } from "remix";
import { ExternalScripts } from "remix-utils/external-scripts";

type Props = { children: React.ReactNode; title?: string };

export function Document({ children, title }: Props) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				{title ? <title>{title}</title> : null}
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<ExternalScripts />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
```

Now, any script you defined in the ScriptsFunction will be added to the HTML.

You could use this util together with `useShouldHydrate` to disable Remix scripts in certain routes but still load scripts for analytics or small features that need JS but don't need the full app JS to be enabled.

```tsx
let shouldHydrate = useShouldHydrate();

return (
	<html lang="en">
		<head>
			<meta charSet="utf-8" />
			<meta name="viewport" content="width=device-width,initial-scale=1" />
			{title ? <title>{title}</title> : null}
			<Meta />
			<Links />
		</head>
		<body>
			{children}
			<ScrollRestoration />
			{shouldHydrate ? <Scripts /> : <ExternalScripts />}
			<LiveReload />
		</body>
	</html>
);
```

### useGlobalNavigationState

> **Note**
> This depends on `react`, and `@remix-run/react`.

This hook allows you to read the value of `transition.state`, every `fetcher.state` in the app, and `revalidator.state`.

```ts
import { useGlobalNavigationState } from "remix-utils/use-global-navigation-state";

export function GlobalPendingUI() {
	let states = useGlobalNavigationState();

	if (state.includes("loading")) {
		// The app is loading.
	}

	if (state.includes("submitting")) {
		// The app is submitting.
	}

	// The app is idle
}
```

The return value of `useGlobalNavigationState` can be `"idle"`, `"loading"` or `"submitting"`

> **Note**
> This is used by the hooks below to determine if the app is loading, submitting or both (pending).

### useGlobalPendingState

> **Note**
> This depends on `react`, and `@remix-run/react`.

This hook lets you know if the global navigation, if one of any active fetchers is either loading or submitting, or if the revalidator is running.

```ts
import { useGlobalPendingState } from "remix-utils/use-global-navigation-state";

export function GlobalPendingUI() {
  let globalState = useGlobalPendingState();

  if (globalState === "idle") return null;
  return <Spinner />;
}
```

The return value of `useGlobalPendingState` is either `"idle"` or `"pending"`.

> **Note**: This hook combines the `useGlobalSubmittingState` and `useGlobalLoadingState` hooks to determine if the app is pending.

> **Note**: The `pending` state is a combination of the `loading` and `submitting` states introduced by this hook.

### useGlobalSubmittingState

> **Note**
> This depends on `react`, and `@remix-run/react`.

This hook lets you know if the global transition or if one of any active fetchers is submitting.

```ts
import { useGlobalSubmittingState } from "remix-utils/use-global-navigation-state";

export function GlobalPendingUI() {
  let globalState = useGlobalSubmittingState();

  if (globalState === "idle") return null;
  return <Spinner />;
}
```

The return value of `useGlobalSubmittingState` is either `"idle"` or `"submitting"`.

### useGlobalLoadingState

> **Note**
> This depends on `react`, and `@remix-run/react`.

This hook lets you know if the global transition, if one of any active fetchers is loading, or if the revalidator is running

```ts
import { useGlobalLoadingState } from "remix-utils/use-global-navigation-state";

export function GlobalPendingUI() {
  let globalState = useGlobalLoadingState();

  if (globalState === "idle") return null;
  return <Spinner />;
}
```

The return value of `useGlobalLoadingState` is either `"idle"` or `"loading"`.

### useHydrated

> **Note**
> This depends on `react`.

This hook lets you detect if your component is already hydrated. This means the JS for the element loaded client-side and React is running.

With useHydrated, you can render different things on the server and client while ensuring the hydration will not have a mismatched HTML.

```ts
import { useHydrated } from "remix-utils/use-hydrated";

export function Component() {
  let isHydrated = useHydrated();

  if (isHydrated) {
    return <ClientOnlyComponent />;
  }

  return <ServerFallback />;
}
```

When doing SSR, the value of `isHydrated` will always be `false`. The first client-side render `isHydrated` will still be false, and then it will change to `true`.

After the first client-side render, future components rendered calling this hook will receive `true` as the value of `isHydrated`. This way, your server fallback UI will never be rendered on a route transition.

### useLocales

> **Note**
> This depends on `react`.

This hook lets you get the locales returned by the root loader. It follows a simple convention, your root loader return value should be an object with the key `locales`.

You can combine it with `getClientLocal` to get the locales on the root loader and return that. The return value of `useLocales` is a `Locales` type which is `string | string[] | undefined`.

```ts
import { useLocales } from "remix-utils/locales/react";
import { getClientLocales } from "remix-utils/locales/server";

// in the root loader
export async function loader({ request }: LoaderFunctionArgs) {
  let locales = getClientLocales(request);
  return json({ locales });
}

// in any route (including root!)
export default function Component() {
  let locales = useLocales();
  let date = new Date();
  let dateTime = date.toISOString;
  let formattedDate = date.toLocaleDateString(locales, options);
  return <time dateTime={dateTime}>{formattedDate}</time>;
}
```

The return type of `useLocales` is ready to be used with the Intl API.

### useShouldHydrate

> **Note**
> This depends on `@remix-run/react` and `react`.

If you are building a Remix application where most routes are static, and you want to avoid loading client-side JS, you can use this hook, plus some conventions, to detect if one or more active routes needs JS and only render the Scripts component in that case.

In your document component, you can call this hook to dynamically render the Scripts component if needed.

```tsx
import type { ReactNode } from "react";
import { Links, LiveReload, Meta, Scripts } from "@remix-run/react";
import { useShouldHydrate } from "remix-utils/use-should-hydrate";

interface DocumentProps {
	children: ReactNode;
	title?: string;
}

export function Document({ children, title }: DocumentProps) {
	let shouldHydrate = useShouldHydrate();
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<link rel="icon" href="/favicon.png" type="image/png" />
				{title ? <title>{title}</title> : null}
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				{shouldHydrate && <Scripts />}
				<LiveReload />
			</body>
		</html>
	);
}
```

Now, you can export a `handle` object with the `hydrate` property as `true` in any route module.

```ts
export let handle = { hydrate: true };
```

This will mark the route as requiring JS hydration.

In some cases, a route may need JS based on the data the loader returned. For example, if you have a component to purchase a product, but only authenticated users can see it, you don't need JS until the user is authenticated. In that case, you can make `hydrate` be a function receiving your loader data.

```ts
export let handle = {
	hydrate(data: LoaderData) {
		return data.user.isAuthenticated;
	},
};
```

The `useShouldHydrate` hook will detect `hydrate` as a function and call it using the route data.

### getClientIPAddress

> **Note**
> This depends on `is-ip`.

This function receives a Request or Headers objects and will try to get the IP address of the client (the user) who originated the request.

```ts
import { getClientIPAddress } from "remix-utils/get-client-ip-address";

export async function loader({ request }: LoaderFunctionArgs) {
	// using the request
	let ipAddress = getClientIPAddress(request);
	// or using the headers
	let ipAddress = getClientIPAddress(request.headers);
}
```

If it can't find he IP address the return value will be `null`. Remember to check if it was able to find it before using it.

The function uses the following list of headers, in order of preference:

- X-Client-IP
- X-Forwarded-For
- HTTP-X-Forwarded-For
- Fly-Client-IP
- CF-Connecting-IP
- Fastly-Client-Ip
- True-Client-Ip
- X-Real-IP
- X-Cluster-Client-IP
- X-Forwarded
- Forwarded-For
- Forwarded
- DO-Connecting-IP
- oxygen-buyer-ip

When a header is found that contains a valid IP address, it will return without checking the other headers.

> **Warning**
> On local development the function is most likely to return `null`. This is because the browser doesn't send any of the above headers, if you want to simulate those headers you will need to either add it to the request Remix receives in your HTTP server or run a reverse proxy like NGINX that can add them for you.

### getClientLocales

> **Note**
> This depends on `intl-parse-accept-language`.

This function let you get the locales of the client (the user) who originated the request.

```ts
import { getClientLocales } from "remix-utils/locales/server";

export async function loader({ request }: LoaderFunctionArgs) {
	// using the request
	let locales = getClientLocales(request);
	// or using the headers
	let locales = getClientLocales(request.headers);
}
```

The return value is a Locales type, which is `string | string[] | undefined`.

The returned locales can be directly used on the Intl API when formatting dates, numbers, etc.

```ts
import { getClientLocales } from "remix-utils/locales/server";
export async function loader({ request }: LoaderFunctionArgs) {
	let locales = getClientLocales(request);
	let nowDate = new Date();
	let formatter = new Intl.DateTimeFormat(locales, {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	return json({ now: formatter.format(nowDate) });
}
```

The value could also be returned by the loader and used on the UI to ensure the user's locales is used on both server and client formatted dates.

### isPrefetch

This function let you identify if a request was created because of a prefetch triggered by using `<Link prefetch="intent">` or `<Link prefetch="render">`.

This will let you implement a short cache only for prefetch requests so you [avoid the double data request](https://sergiodxa.com/articles/fix-double-data-request-when-prefetching-in-remix).

```ts
import { isPrefetch } from "remix-utils/is-prefetch";

export async function loader({ request }: LoaderFunctionArgs) {
	let data = await getData(request);
	let headers = new Headers();

	if (isPrefetch(request)) {
		headers.set("Cache-Control", "private, max-age=5, smax-age=0");
	}

	return json(data, { headers });
}
```

### Responses

#### Redirect Back

This function is a wrapper of the `redirect` helper from Remix. Unlike Remix's version, this one receives the whole request object as the first value and an object with the response init and a fallback URL.

The response created with this function will have the `Location` header pointing to the `Referer` header from the request, or if not available, the fallback URL provided in the second argument.

```ts
import { redirectBack } from "remix-utils/redirect-back";

export async function action({ request }: ActionFunctionArgs) {
	throw redirectBack(request, { fallback: "/" });
}
```

This helper is most useful when used in a generic action to send the user to the same URL it was before.

#### Not Modified

Helper function to create a Not Modified (304) response without a body and any header.

```ts
import { notModified } from "remix-utils/responses";

export async function loader({ request }: LoaderFunctionArgs) {
	return notModified();
}
```

#### JavaScript

Helper function to create a JavaScript file response with any header.

This is useful to create JS files based on data inside a Resource Route.

```ts
import { javascript } from "remix-utils/responses";

export async function loader({ request }: LoaderFunctionArgs) {
	return javascript("console.log('Hello World')");
}
```

#### Stylesheet

Helper function to create a CSS file response with any header.

This is useful to create CSS files based on data inside a Resource Route.

```ts
import { stylesheet } from "remix-utils/responses";

export async function loader({ request }: LoaderFunctionArgs) {
	return stylesheet("body { color: red; }");
}
```

#### PDF

Helper function to create a PDF file response with any header.

This is useful to create PDF files based on data inside a Resource Route.

```ts
import { pdf } from "remix-utils/responses";

export async function loader({ request }: LoaderFunctionArgs) {
	return pdf(await generatePDF(request.formData()));
}
```

#### HTML

Helper function to create a HTML file response with any header.

This is useful to create HTML files based on data inside a Resource Route.

```ts
import { html } from "remix-utils/responses";

export async function loader({ request }: LoaderFunctionArgs) {
	return html("<h1>Hello World</h1>");
}
```

#### XML

Helper function to create a XML file response with any header.

This is useful to create XML files based on data inside a Resource Route.

```ts
import { xml } from "remix-utils/responses";

export async function loader({ request }: LoaderFunctionArgs) {
	return xml("<?xml version='1.0'?><catalog></catalog>");
}
```

#### Plain Text

Helper function to create a TXT file response with any header.

This is useful to create TXT files based on data inside a Resource Route.

```ts
import { txt } from "remix-utils/responses";

export async function loader({ request }: LoaderFunctionArgs) {
	return txt(`
    User-agent: *
    Allow: /
  `);
}
```

### Typed Cookies

> **Note**
> This depends on `zod`, and a Remix server runtime.

Cookie objects in Remix allows any type, the typed cookies from Remix Utils lets you use Zod to parse the cookie values and ensure they conform to a schema.

```ts
import { createCookie } from "@remix-run/node";
import { createTypedCookie } from "remix-utils/typed-cookie";
import { z } from "zod";

let cookie = createCookie("returnTo", cookieOptions);
// I recommend you to always add `nullable` to your schema, if a cookie didn't
// come with the request Cookie header Remix will return null, and it can be
// useful to remove it later when clearing the cookie
let schema = z.string().url().nullable();

// pass the cookie and the schema
let typedCookie = createTypedCookie({ cookie, schema });

// this will be a string and also a URL
let returnTo = await typedCookie.parse(request.headers.get("Cookie"));

// this will not pass the schema validation and throw a ZodError
await typedCookie.serialize("a random string that's not a URL");
// this will make TS yell because it's not a string, if you ignore it it will
// throw a ZodError
await typedCookie.serialize(123);
```

You could also use typed cookies with any sessionStorage mechanism from Remix.

```ts
let cookie = createCookie("session", cookieOptions);
let schema = z.object({ token: z.string() }).nullable();

let sessionStorage = createCookieSessionStorage({
	cookie: createTypedCookie({ cookie, schema }),
});

// if this works then the correct data is stored in the session
let session = sessionStorage.getSession(request.headers.get("Cookie"));

session.unset("token"); // remove a required key from the session

// this will throw a ZodError because the session is missing the required key
await sessionStorage.commitSession(session);
```

Now Zod will ensure the data you try to save to the session is valid removing any extra field and throwing if you don't set the correct data in the session.

> **Note**
> The session object is not really typed so doing session.get will not return the correct type, you can do `schema.parse(session.data)` to get the typed version of the session data.

You can also use async refinements in your schemas because typed cookies uses parseAsync method from Zod.

```ts
let cookie = createCookie("session", cookieOptions);

let schema = z
	.object({
		token: z.string().refine(async (token) => {
			let user = await getUserByToken(token);
			return user !== null;
		}, "INVALID_TOKEN"),
	})
	.nullable();

let sessionTypedCookie = createTypedCookie({ cookie, schema });

// this will throw if the token stored in the cookie is not valid anymore
sessionTypedCookie.parse(request.headers.get("Cookie"));
```

Finally, to be able to delete a cookie, you can add `.nullable()` to your schema and serialize it with `null` as value.

```ts
// Set the value as null and expires as current date - 1 second so the browser expires the cookie
await typedCookie.serialize(null, { expires: new Date(Date.now() - 1) });
```

If you didn't add `.nullable()` to your schema, you will need to provide a mock value and set the expires date to the past.

```ts
let cookie = createCookie("returnTo", cookieOptions);
let schema = z.string().url().nullable();

let typedCookie = createTypedCookie({ cookie, schema });

await typedCookie.serialize("some fake url to pass schema validation", {
	expires: new Date(Date.now() - 1),
});
```

### Typed Sessions

> **Note**
> This depends on `zod`, and a Remix server runtime.

Session objects in Remix allows any type, the typed sessions from Remix Utils lets you use Zod to parse the session data and ensure they conform to a schema.

```ts
import { createCookieSessionStorage } from "@remix-run/node";
import { createTypedSessionStorage } from "remix-utils/typed-session";
import { z } from "zod";

let schema = z.object({
	token: z.string().optional(),
	count: z.number().default(1),
});

// you can use a Remix's Cookie container or a Remix Utils' Typed Cookie container
let sessionStorage = createCookieSessionStorage({ cookie });

// pass the session storage and the schema
let typedSessionStorage = createTypedSessionStorage({ sessionStorage, schema });
```

Now you can use typedSessionStorage as a drop-in replacement for your normal sessionStorage.

```ts
let session = typedSessionStorage.getSession(request.headers.get("Cookie"));

session.get("token"); // this will be a string or undefined
session.get("count"); // this will be a number
session.get("random"); // this will make TS yell because it's not in the schema

session.has("token"); // this will be a boolean
session.has("count"); // this will be a boolean

// this will make TS yell because it's not a string, if you ignore it it will
// throw a ZodError
session.set("token", 123);
```

Now Zod will ensure the data you try to save to the session is valid by not allowing you to get, set or unset data.

> **Note**
> Remember that you either need to mark fields as optional or set a default value in the schema, otherwise it will be impossible to call getSession to get a new session object.

You can also use async refinements in your schemas because typed sesions uses parseAsync method from Zod.

```ts
let schema = z.object({
	token: z
		.string()
		.optional()
		.refine(async (token) => {
			if (!token) return true; // handle optionallity
			let user = await getUserByToken(token);
			return user !== null;
		}, "INVALID_TOKEN"),
});

let typedSessionStorage = createTypedSessionStorage({ sessionStorage, schema });

// this will throw if the token stored in the session is not valid anymore
typedSessionStorage.getSession(request.headers.get("Cookie"));
```

### Server-Sent Events

> **Note**
> This depends on `react`.

Server-Sent Events are a way to send data from the server to the client without the need for the client to request it. This is useful for things like chat applications, live updates, and more.

There are two utils provided to help with the usage inside Remix:

- `eventStream`
- `useEventSource`

The `eventStream` function is used to create a new event stream response needed to send events to the client. This must live in a [Resource Route](https://remix.run/docs/en/1.18.1/guides/resource-routes).

```ts
// app/routes/sse.time.ts
import { eventStream } from "remix-utils/sse/server";
import { interval } from "remix-utils/timers";

export async function loader({ request }: LoaderFunctionArgs) {
	return eventStream(request.signal, function setup(send) {
		async function run() {
			for await (let _ of interval(1000, { signal: request.signal })) {
				send({ event: "time", data: new Date().toISOString() });
			}
		}

		run();
	});
}
```

Then, inside any component, you can use the `useEventSource` hook to connect to the event stream.

```tsx
// app/components/counter.ts
import { useEventSource } from "remix-utils/sse/react";

function Counter() {
	// Here `/sse/time` is the resource route returning an eventStream response
	let time = useEventSource("/sse/time", { event: "time" });

	if (!time) return null;

	return (
		<time dateTime={time}>
			{new Date(time).toLocaleTimeString("en", {
				minute: "2-digit",
				second: "2-digit",
				hour: "2-digit",
			})}
		</time>
	);
}
```

The `event` name in both the event stream and the hook is optional, in which case it will default to `message`, if defined you must use the same event name in both sides, this also allows you to emit different events from the same event stream.

For Server-Sent Events to work, your server must support HTTP streaming. If you don't get SSE to work check if your deployment platform has support for it.

Because SSE count towards the limit of HTTP connections per domain, the `useEventSource` hook keeps a global map of connections based on the provided URL and options. As long as they are the same, the hook will open a single SSE connection and share it between instances of the hook.

Once there are no more instances of the hook re-using a connection, it will be closed and removed from the map.

You can use the `<EventSourceProvider />` component to control the map.

```tsx
let map: EventSourceMap = new Map();
return (
	<EventSourceProvider value={map}>
		<YourAppOrPartOfIt />
	</EventSourceProvider>
);
```

This way, you can overwrite the map with a new one for a specific part of your app. Note that this provider is optional and a default map will be used if you don't provide one.

### Rolling Cookies

> **Note**
> This depends on `zod`, and a Remix server runtime.

Rolling cookies allows you to prolong the expiration of a cookie by updating the expiration date of every cookie.

The `rollingCookie` function is prepared to be used in `entry.server` exported function to update the expiration date of a cookie if no loader set it.

For document request you can use it on the `handleRequest` function:

```ts
import { rollingCookie } from "remix-utils/rolling-cookie";

import { sessionCookie } from "~/session.server";

export default function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext,
) {
	await rollingCookie(sessionCookie, request, responseHeaders);

	return isbot(request.headers.get("user-agent"))
		? handleBotRequest(
				request,
				responseStatusCode,
				responseHeaders,
				remixContext,
		  )
		: handleBrowserRequest(
				request,
				responseStatusCode,
				responseHeaders,
				remixContext,
		  );
}
```

And for data request you can do it on the `handleDataRequest` function:

```ts
import { rollingCookie } from "remix-utils/rolling-cookie";

export let handleDataRequest: HandleDataRequestFunction = async (
	response: Response,
	{ request },
) => {
	let cookieValue = await sessionCookie.parse(
		responseHeaders.get("set-cookie"),
	);
	if (!cookieValue) {
		cookieValue = await sessionCookie.parse(request.headers.get("cookie"));
		responseHeaders.append(
			"Set-Cookie",
			await sessionCookie.serialize(cookieValue),
		);
	}

	return response;
};
```

> **Note** > [Read more about rolling cookies in Remix](https://sergiodxa.com/articles/add-rolling-sessions-to-remix).

### Named actions

> **Note**
> This depends on a Remix server runtime.

It's common to need to handle more than one action in the same route, there are many options here like [sending the form to a resource route](https://sergiodxa.com/articles/multiple-forms-per-route-in-remix#using-resource-routes) or using an [action reducer](https://sergiodxa.com/articles/multiple-forms-per-route-in-remix#the-action-reducer-pattern), the `namedAction` function uses some conventions to implement the action reducer pattern.

```tsx
import { namedAction } from "remix-utils/named-action";

export async function action({ request }: ActionFunctionArgs) {
	return namedAction(request, {
		async create() {
			// do create
		},
		async update() {
			// do update
		},
		async delete() {
			// do delete
		},
	});
}

export default function Component() {
	return (
		<>
			<Form method="post" action="?/create">
				...
			</Form>

			<Form method="post" action="?/update">
				...
			</Form>

			<Form method="post" action="?/delete">
				...
			</Form>
		</>
	);
}
```

This function can follow many conventions

You can pass a FormData object to the `namedAction`, then it will try to

- Find a field named `/something` and use it as the action name removing the `/`
- Find a field named `intent` and use the value as the action name
- Find a field named `action` and use the value as the action name
- Find a field named `_action` and use the value as the action name

You can pass an URLSearchParams object to the `namedAction`, then it will try to

- Find a query parameter named `/something` and use it as the action name removing the `/`
- Find a query parameter named `intent` and use the value as the action name
- Find a query parameter named `action` and use the value as the action name
- Find a query parameter named `_action` and use the value as the action name

You can pass an URL object to the `namedAction`, it will behave as with a URLSearchParams object.

You can pass a Request object to the `namedAction`, then it will try to

- Call `new URL(request.url)` and use it as the URL object
- Call `request.formData()` and use it as the FormData object

If, in any case, the action name is not found, the `actionName` then the library will try to call an action named `default`, similar to a `switch` in JavaScript.

If the `default` is not defined it will throw a ReferenceError with the message `Action "${name}" not found`.

If the library couldn't found the name at all, it will throw a ReferenceError with the message `Action name not found`

### Preload Route Assets

> [!CAUTION]
> This can potentialy create big `Link` header and can cause extremely hard to debug issues. Some provider's load balancers have set certain buffer for parsing outgoing response's headers and thanks to `preloadRouteAssets` you can easily reach that in a medium sized application.
> Your load balancer can randomly stop responding or start throwing 502 error.
> To overcome this either don't use `preloadRouteAssets`, set bigger buffer for processing response headers if you own the loadbalancer or use the `experimentalMinChunkSize` option in Vite config (this does not solve the issue permanently, only delays it)

The `Link` header allows responses to push to the browser assets that are needed for the document, this is useful to improve the performance of the application by sending those assets earlier.

Once Early Hints is supported this will also allows you to send the assets even before the document is ready, but for now you can benefit to send assets to preload before the browser parse the HTML.

You can do this with the functions `preloadRouteAssets`, `preloadLinkedAssets` and `preloadModuleAssets`.

All functions follows the same signature:

```ts
import { preloadRouteAssets, preloadLinkedAssets, preloadModuleAssets } from "remix-utils/preload-route-assets";

// entry.server.tsx
export default function handleRequest(
  request: Request,
  statusCode: number,
  headers: Headers,
  context: EntryContext,
) {
  let markup = renderToString(
    <RemixServer context={context} url={request.url} />,
  );
  headers.set("Content-Type", "text/html");

  preloadRouteAssets(context, headers); // add this line
  // preloadLinkedAssets(context, headers);
  // preloadModuleAssets(context, headers);

  return new Response("<!DOCTYPE html>" + markup, {
    status: statusCode,
    headers: headers,
  });
}
```

The `preloadRouteAssets` is a combination of both `preloadLinkedAssets` and `preloadModuleAssets` so you can use it to preload all assets for a route, if you use this one you don't need the other two

The `preloadLinkedAssets` function will preload any link with `rel: "preload"` added with the Remix's `LinkFunction`, so you can configure assets to preload in your route and send them in the headers automatically. It will additionally preload any linked stylesheet file (with `rel: "stylesheet"`) even if not preloaded so it will load faster.

The `preloadModuleAssets` function will preload all the JS files Remix adds to the page when hydrating it, Remix already renders a `<link rel="modulepreload">` for each now before the `<script type="module">` used to start the application, this will use Link headers to preload those assets.

### Safe Redirects

When performing a redirect, if the URL is user provided we can't trust it, if you do you're opening a vulnerability to phishing scam by allowing bad actors to redirect the user to malicious websites.

```
https://remix.utills/?redirectTo=https://malicious.app
```

To help you prevent this Remix Utils gives you a `safeRedirect` function which can be used to check if the URL is "safe".

> **Note**
> In this context, safe means the URL starts with `/` but not `//`, this means the URL is a pathname inside the same app and not an external link.

```ts
import { safeRedirect } from "remix-utils/safe-redirect";

export async function loader({ request }: LoaderFunctionArgs) {
	let { searchParams } = new URL(request.url);
	let redirectTo = searchParams.get("redirectTo");
	return redirect(safeRedirect(redirectTo, "/home"));
}
```

The second argumento of `safeRedirect` is the default redirect which by when not configured is `/`, this lets you tell `safeRedirect` where to redirect the user if the value is not safe.

### JSON Hash Response

When returning a `json` from a `loader` function, you may need to get data from different DB queries or API requests, typically you would something like this

```ts
export async function loader({ params }: LoaderData) {
	let postId = z.string().parse(params.postId);
	let [post, comments] = await Promise.all([getPost(), getComments()]);
	return json({ post, comments });

	async function getPost() {
		/* … */
	}
	async function getComments() {
		/* … */
	}
}
```

The `jsonHash` function lets you define those functions directly in the `json`, reducing the need to create extra functions and variables.

```ts
import { jsonHash } from "remix-utils/json-hash";

export async function loader({ params }: LoaderData) {
	let postId = z.string().parse(params.postId);
	return jsonHash({
		async post() {
			// Implement me
		},
		async comments() {
			// Implement me
		},
	});
}
```

It also calls your functions using `Promise.all` so you can be sure the data is retrieved in parallel.

Additionally, you can pass non-async functions, values and promises.

```ts
import { jsonHash } from "remix-utils/json-hash";

export async function loader({ params }: LoaderData) {
	let postId = z.string().parse(params.postId);
	return jsonHash({
		postId, // value
		comments: getComments(), // Promise
		slug() {
			// Non-async function
			return postId.split("-").at(1); // get slug from postId param
		},
		async post() {
			// Async function
			return await getPost(postId);
		},
	});

	async function getComments() {
		/* … */
	}
}
```

The result of `jsonHash` is a `TypedResponse` and it's correctly typed so using it with `typeof loader` works flawlessly.

```ts
export default function Component() {
	// all correctly typed
	let { postId, comments, slug, post } = useLoaderData<typeof loader>();

	// more code…
}
```

### Delegate Anchors to Remix

When using Remix, you can use the `<Link>` component to navigate between pages. However, if you have a `<a href>` that links to a page in your app, it will cause a full page refresh. This can be what you want, but sometimes you want to use client-side navigation here instead.

The `useDelegatedAnchors` hook lets you add client-side navigation to anchor tags in a portion of your app. This can be specially useful when working with dynamic content like HTML or Markdown from a CMS.

```tsx
import { useDelegatedAnchors } from "remix-utils/use-delegated-anchors";

export async function loader() {
	let content = await fetchContentFromCMS();
	return json({ content });
}

export default function Component() {
	let { content } = useLoaderData<typeof loader>();

	let ref = useRef<HTMLDivElement>(null);
	useDelegatedAnchors(ref);

	return <article ref={ref} dangerouslySetInnerHTML={{ __html: content }} />;
}
```

### Prefetch Anchors

If additionally you want to be able to prefetch your anchors you can use the `PrefetchPageAnchors` components.

This components wraps your content with anchors inside, it detects any hovered anchor to prefetch it, and it delegates them to Remix.

```tsx
import { PrefetchPageAnchors } from "remix-utils/use-delegated-anchors";

export async function loader() {
	let content = await fetchContentFromCMS();
	return json({ content });
}

export default function Component() {
	let { content } = useLoaderData<typeof loader>();

	return (
		<PrefetchPageAnchors>
			<article ref={ref} dangerouslySetInnerHTML={{ __html: content }} />
		</PrefetchPageAnchors>
	);
}
```

Now you can see in your DevTools that when the user hovers an anchor it will prefetch it, and when the user clicks it will do a client-side navigation.

### Debounced Fetcher and Submit

> **Note**
> This depends on `react`, and `@remix-run/react`.

`useDebounceFetcher` and `useDebounceSubmit` are wrappers of `useFetcher` and `useSubmit` that add debounce support.

These hooks are based on [@JacobParis](https://github.com/JacobParis)' [article](https://www.jacobparis.com/content/use-debounce-fetcher).

```tsx
import { useDebounceFetcher } from "remix-utils/use-debounce-fetcher";

export function Component({ data }) {
	let fetcher = useDebounceFetcher<Type>();

	function handleClick() {
		fetcher.submit(data, { debounceTimeout: 1000 });
	}

	return (
		<button type="button" onClick={handleClick}>
			Do Something
		</button>
	);
}
```

Usage with `useDebounceSubmit` is similar.

```tsx
import { useDebounceSubmit } from "remix-utils/use-debounce-submit";

export function Component({ name }) {
	let submit = useDebounceSubmit();

	return (
		<input
			name={name}
			type="text"
			onChange={(event) => {
				submit(event.target.form, {
					navigate: false, // use a fetcher instead of a page navigation
					fetcherKey: name, // cancel any previous fetcher with the same key
					debounceTimeout: 1000,
				});
			}}
			onBlur={() => {
				submit(event.target.form, {
					navigate: false,
					fetcherKey: name,
					debounceTimeout: 0, // submit immediately, canceling any pending fetcher
				});
			}}
		/>
	);
}
```

### Derive Fetcher Type

> **Note**
> This depends on `@remix-route/react`.

Derive the value of the deprecated `fetcher.type` from the fetcher and navigation data.

```ts
import { getFetcherType } from "remix-utils/fetcher-type";

function Component() {
	let fetcher = useFetcher();
	let navigation = useNavigation();
	let fetcherType = getFetcherType(fetcher, navigation);
	useEffect(() => {
		if (fetcherType === "done") {
			// do something once the fetcher is done submitting the data
		}
	}, [fetcherType]);
}
```

You can also use the React Hook API which let's you avoid calling `useNavigation`.

```ts
import { useFetcherType } from "remix-utils/fetcher-type";

function Component() {
	let fetcher = useFetcher();
	let fetcherType = useFetcherType(fetcher);
	useEffect(() => {
		if (fetcherType === "done") {
			// do something once the fetcher is done submitting the data
		}
	}, [fetcherType]);
}
```

If you need to pass the fetcher type around, you can also import `FetcherType` type.

```ts
import { type FetcherType } from "remix-utils/fetcher-type";

function useCallbackOnDone(type: FetcherType, cb) {
	useEffect(() => {
		if (type === "done") cb();
	}, [type, cb]);
}
```

### respondTo for Content Negotiation

If you're building a resource route and wants to send a different response based on what content type the client requested (e.g. send the same data as PDF or XML or JSON), you will need to implement content negotiation, this can be done with the `respondTo` header.

```ts
import { respondTo } from "remix-utils/respond-to";

export async function loader({ request }: LoaderFunctionArgs) {
  // do any work independent of the response type before respondTo
  let data = await getData(request);

  let headers = new Headers({ vary: "accept" });

  // Here we will decide how to respond to different content types
  return respondTo(request, {
    // The handler can be a subtype handler, in `text/html` html is the subtype
    html() {
      // We can call any function only really need to respond to this
      // content-type
      let body = ReactDOMServer.renderToString(<UI {...data} />);
      headers.append("content-type", "text/html");
      return new Response(body, { headers });
    },
    // It can also be a highly specific type
    async "application/rss+xml"() {
      // we can do more async work inside this code if needed
      let body = await generateRSSFeed(data);
      headers.append("content-type", "application/rss+xml");
      return new Response(body, { headers });
    },
    // Or a generic type
    async text() {
      // To respond to any text type, e.g. text/plain, text/csv, etc.
      let body = generatePlain(data);
      headers.append("content-type", "text/plain");
      return new Response(body, { headers });
    },
    // The default will be used if the accept header doesn't match any of the
    // other handlers
    default() {
      // Here we could have a default type of response, e.g. use json by
      // default, or we can return a 406 which means the server can't respond
      // with any of the requested content types
      return new Response("Not Acceptable", { status: 406 });
    },
  });
}
```

Now, the `respondTo` function will check the `Accept` header and call the correct handler, to know which one to call it will use the `parseAcceptHeader` function also exported from Remix Utils

```ts
import { parseAcceptHeader } from "remix-utils/parse-accept-header";

let parsed = parseAcceptHeader(
	"text/html, application/xhtml+xml, application/xml;q=0.9, image/webp, image/*, */*;q=0.8",
);
```

The result is an array with the type, subtype and extra params (e.g. the `q` value). The order will be the same encountered in the header, in the example aabove `text/html` will be the first, followed by `application/xhtml+xml`.

This means that the `respondTo` helper will prioritize any handler that match `text/html`, in our example above, that will be the `html` handler, but if we remove it then the `text` handler will be called instead.67

### Form Honeypot

> **Note**
> This depends on `react` and `crypto-js`.

Honeypot is a simple technique to prevent spam bots from submitting forms. It works by adding a hidden field to the form that bots will fill, but humans won't.

There's a pair of utils in Remix Utils to help you implement this.

First, create a `honeypot.server.ts` where you will instantiate and configure your Honeypot.

```tsx
import { Honeypot } from "remix-utils/honeypot/server";

// Create a new Honeypot instance, the values here are the defaults, you can
// customize them
export const honeypot = new Honeypot({
	randomizeNameFieldName: false,
	nameFieldName: "name__confirm",
	validFromFieldName: "from__confirm", // null to disable it
	encryptionSeed: undefined, // Ideally it should be unique even between processes
});
```

Then, in your `app/root` loader, call `honeypot.getInputProps()` and return it.

```ts
// app/root.tsx
import { honeypot } from "~/honeypot.server";

export async function loader() {
	// more code here
	return json({ honeypotInputProps: honeypot.getInputProps() });
}
```

And in the `app/root` component render the `HoneypotProvider` component wrapping the rest of the UI.

```tsx
import { HoneypotProvider } from "remix-utils/honeypot/react";

export default function Component() {
	// more code here
	return (
		// some JSX
		<HoneypotProvider {...honeypotInputProps}>
			<Outlet />
		</HoneypotProvider>
		// end that JSX
	);
}
```

Now, in every public form you want protect against spam (like a login form), render the `HoneypotInputs` component.

```tsx
import { HoneypotInputs } from "remix-utils/honeypot/react";

function SomePublicForm() {
	return (
		<Form method="post">
			<HoneypotInputs label="Please leave this field blank" />
			{/* more inputs and some buttons */}
		</Form>
	);
}
```

> **Note**
> The label value above is the default one, use it to allow the label to be localized, or remove it if you don't want to change it.

Finally, in the action the form submits to, you can call `honeypot.check`.

```ts
import { SpamError } from "remix-utils/honeypot/server";
import { honeypot } from "~/honeypot.server";

export async function action({ request }) {
	let formData = await request.formData();
	try {
		honeypot.check(formData);
	} catch (error) {
		if (error instanceof SpamError) {
			// handle spam requests here
		}
		// handle any other possible error here, e.g. re-throw since nothing else
		// should be thrown
	}
	// the rest of your action
}
```

### Sec-Fetch Parsers

> **Note**
> This depends on `zod`.

The `Sec-Fetch` headers include information about the request, e.g. where is the data going to be used, or if it was initiated by the user.

You can use the `remix-utils/sec-fetch` utils to parse those headers and get the information you need.

```ts
import {
	fetchDest,
	fetchMode,
	fetchSite,
	isUserInitiated,
} from "remix-utils/sec-fetch";
```

#### Sec-Fetch-Dest

The `Sec-Fetch-Dest` header indicates the destination of the request, e.g. `document`, `image`, `script`, etc.

If the value is `empty` it means it will be used by a `fetch` call, this means you can differentiate between a request made with and without JS by checking if it's `document` (no JS) or `empty` (JS enabled).

```ts
import { fetchDest } from "remix-utils/sec-fetch";

export async function action({ request }: ActionFunctionArgs) {
	let data = await getDataSomehow();

	// if the request was made with JS, we can just return json
	if (fetchDest(request) === "empty") return json(data);
	// otherwise we redirect to avoid a reload to trigger a new submission
	return redirect(destination);
}
```

#### Sec-Fetch-Mode

The `Sec-Fetch-Mode` header indicates how the request was initiated, e.g. if the value is `navigate` it was triggered by the user loading the page, if the value is `no-cors` it could be an image being loaded.

```ts
import { fetchMode } from "remix-utils/sec-fetch";

export async function loader({ request }: LoaderFunctionArgs) {
	let mode = fetchMode(request);
	// do something based on the mode value
}
```

#### Sec-Fetch-Site

The `Sec-Fetch-Site` header indicates where the request is being made, e.g. `same-origin` means the request is being made to the same domain, `cross-site` means the request is being made to a different domain.

```ts
import { fetchSite } from "remix-utils/sec-fetch";

export async function loader({ request }: LoaderFunctionArgs) {
	let site = fetchSite(request);
	// do something based on the site value
}
```

#### Sec-Fetch-User

The `Sec-Fetch-User` header indicates if the request was initiated by the user, this can be used to differentiate between a request made by the user and a request made by the browser, e.g. a request made by the browser to load an image.

```ts
import { isUserInitiated } from "remix-utils/sec-fetch";

export async function loader({ request }: LoaderFunctionArgs) {
	let userInitiated = isUserInitiated(request);
	// do something based on the userInitiated value
}
```

### Timers

The timers utils gives you a way to wait a certain amount of time before doing something or to run some code every certain amount of time.

Using the `wait` combined with an AbortSignal we can cancel a timeout if the user navigates away from the page.

```ts
import { wait } from "remix-utils/timers";

export async function loader({ request }: LoaderFunctionArgs) {
	await wait(1000, { signal: request.signal });
	// do something after 1 second
}
```

Using the `interval` combined with `eventStream` we could send a value to the client every certain amount of time. And ensure the interval is cancelled if the connection is closed.

```ts
import { eventStream } from "remix-utils/sse/server";
import { interval } from "remix-utils/timers";

export async function loader({ request }: LoaderFunctionArgs) {
	return eventStream(request.signal, function setup(send) {
		async function run() {
			for await (let _ of interval(1000, { signal: request.signal })) {
				send({ event: "time", data: new Date().toISOString() });
			}
		}

		run();
	});
}
```

## Author

- [Sergio Xalambrí](https://sergiodxa.com)

## License

- MIT License
