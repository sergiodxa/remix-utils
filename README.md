# Remix Utils

This package contains simple utility functions and types to use together with [Remix.run](https://remix.run).

**This package requires Remix which needs a paid license to install it**

## Installation

```bash
npm install remix-utils
```

Remember you need to also install `remix`, `@remix-run/node`, `@remix-run/react` and `react`. For the first three you need a paid Remix license.

## API Reference

### ClientOnly

The ClientOnly component lets you render a component only on the client side, avoiding it to be rendered the server side.

You can, optionally, provide a fallback component to be used on SSR.

```tsx
import { ClientOnly } from "remix-utils/react";

export default function View() {
  return (
    <ClientOnly fallback={<SimplerStaticVersion />}>
      <ComplexComponentNeedingBrowserEnvironment />
    </ClientOnly>
  );
}
```

This component, is specially useful when you have some complex component that needs a browser environment to work, like a chart or a map, this way you can avoid rendering it server-side and instead use a simpler static version like a SVG or even an loading UI.

The rendering flow will be:

- SSR: Always render the fallback.
- CSR First Render: Always render the fallback.
- CSR Update: Update to render the actual component.
- CSR Futur Renders: Always render the actual component, don't bother to render the fallback.

This component uses the `useHydrated` hook internally.

### CSRF

### Outlet & useParentData

This wrapper of the Remix Outlet component let you pass an optional `data` prop, then using the `useParentData` hook you can access that data.

Useful to pass information from parent to child routes, example the authenticated user data.

```tsx
// parent route
import { Outlet } from "remix-utils/react";

export default function Parent() {
  return <Outlet data={{ something: "here" }} />;
}
```

```tsx
// child route
import { useParentData } from "remix-utils/react";

export default function Child() {
  const data = useParentData();
  return <div>{data.something}</div>;
}
```

### useHydrated

This let you detect if your component is already hydrated, this means the JS of the component loaded client-side and React is working.

With useHydrated, you can render different things on the server and client, while ensuring the hydration will not have a mismatched HTML.

```ts
import { useHydrated } from "remix-utils/react";

export function Component() {
  let isHydrated = useHydrated();

  if (isHydrated) {
    return <ClientOnlyComponent />;
  }

  return <ServerFallback />;
}
```

When doing SSR the value of `isHydrated` will always be `false`. On the first client-side render `isHydrated` will still be false, and then it will change to `true`.

After the first client-side render, future components rendered calling this hook will receive `true` as the value of `isHydrated`, this way your server fallback UI will never be rendered on a route transition.

### useShouldHydrate

If you are building a Remix application where most routes are static and you want to avoid loading client-side JS you can use this hook, plus some conventions, to detect if one ore more of the active routes needs JS and only render the Scripts component in that case.

In your document component you can call this hook to dynamically render the Scripts component if needed.

```tsx
import type { ReactNode } from "react";
import { Links, LiveReload, Meta, Scripts, } from "remix";
import { useShouldHydrate } from "remix-utils/react";

interface DocumentProps {
  children: ReactNode;
  title?: string;
}

export function Document({ children, title, }: DocumentProps) {
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
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}
```

Now, in any route module you can export a `handle` object with the `hydrate` property as `true`.

```ts
export let handle = { hydrate: true };
```

This will mark the route as requiring JS hydration.

In same cases, a route may need or not JS, based on the data the loader returned, as an example, if you have a component to purchase an product, but only authenticated users can see it, you don't need JS until the user is authenticated. In that case you can make `hydrate` be a function receiving your loader data.

```ts
export let handle = {
  hydate(data: LoaderData) {
    return data.user.isAuthenticated;
  },
};
```

The `useShouldHydrate` hook will detect `hydrate` is a function and call it using the route data.

### Body Parser

These utilities let you parse the request body with a simple function call, you can parse it to a string, a URLSearchParams instance or an object.

#### toString

This functino receives the whole request and returns a promise with the body as a string.

```ts
import { bodyParser, redirectBack } from "remix-utils/server";
import type { ActionFunction } from "remix";

import { updateUser } from "../services/users";

export let action: ActionFunction = async ({ request }) => {
  let body = await bodyParser.toString(request);
  body = new URLSearchParams(body);
  await updateUser(params.id, { username: body.get("username") });
  return redirectBack(request, { fallback: "/" });
}
```

#### toSearchParams

This function receives the whole request and returns a promise with an instance of `URLSearchParams`, and the body of the request already parsed.

```ts
import { bodyParser, redirectBack } from "remix-utils/server";
import type { ActionFunction } from "remix";

import { updateUser } from "../services/users";

export let action: ActionFunction = async ({ request, params }) => {
  const body = await bodyParser.toSearchParams(request);
  await updateUser(params.id, { username: body.get("username") });
  return redirectBack(request, { fallback: "/" });
}
```

This is the same as doing:

```ts
let body = await bodyParser.toString(request);
return new URLSearchParams(body);
```

#### toJSON

This function receives the whole request and returns a promise with an unknown value, that value is going to be the body of the request.

The reason the result is typed as `unknown` is to force you to valida the object to ensure it's what you expect, this is because there's no way for TypeScript to know what the type of the body is since it's a completely dynamic value.

```ts
import { bodyParser, redirectBack } from "remix-utils/server";
import type { ActionFunction } from "remix";
import { hasUsername } from "../validations/users";
import { updateUser } from "~/services/users";

export let action: ActionFunction = async ({ request }) => {
  const body = await bodyParser.toJSON(request);
  hasUsername(body); // this should throw if body doesn't have username
  // from this point you can do `body.username`
  await updateUser(params.id, { username: body.username });
  return redirectBack(request, { fallback: "/" });
}
```

This is the same as doing:

```ts
let body = await bodyParser.toSearchParams(request);
return Object.fromEntries(params.entries()) as unknown;
```

### Responses

#### Typed JSON

This function is a typed version of the `json` helper provided by Remix, it accepts a generic which defaults to `unknown` with the type of data you are going to send in the response.

This helps ensure at the compiler lever that the data you are sending from your loader matches the provided type. It's more useful when you create a type or interface for your loader so you can share it between `json` and `useLoaderData` to help you avoid missing or extra parameters in the response.

Again, this is not doing any kind of validation on the data you send, it's just a type checker.

The generic extends JsonValue from [type-fest](https://github.com/sindresorhus/type-fest/blob/ff96fef37b84137e1600eebce108c2b797427c1f/source/basic.d.ts#L45), this limit the type of data you can send to anything that can be serializable so you are not going to be able to send BigInt, functions, Symbols, etc. If `JSON.stringify` fails trying to stringify the data, it will not be supported.

```tsx
import { useLoaderData } from "remix";
import type { LoaderFunction } from "remix";
import { json } from "remix-utils/server";

import { getUser } from "../services/users";
import type { User } from "../types";

interface LoaderData {
  user: User;
}

export let loader: LoaderFunction = async ({request}) => {
  const user = await getUser(request);
  return json<LoaderData>({ user });
}

export default function View() {
  const { user } = useLoaderData<LoaderData>();
  return <h1>Hello, {user.name}</h1>;
}
```

#### Redirect Back

This function is a wrapper of the `redirect` helper from Remix, contrarian to Remix's version this one receives the whole request object as first value and an object with the response init and a fallback URL.

The response created with this function will have the `Location` header pointing to the `Referer` header from the request, or if not available the fallback URL provided in the second argument.

```ts
import { redirectBack } from "remix-utils/server";
import type { ActionFunction } from "remix";

export let action: ActionFunction = async ({ request }) => {
  await redirectBack(request, { fallback: "/" });
}
```

This helper is more useful when used in an generic action so you can send the user to the same URL it was before.

#### Bad Request

Helper function to create a Bad Request (400) response with a JSON body.

```ts
import { badRequest } from "remix-utils/server";
import type { ActionFunction } from "remix";

export action: ActionFunction = async () => {
  throw badRequest({ message: "You forgot something in the form." });
}
```

#### Unauthorized

Helper function to create a Unauthorized (401) response with a JSON body.

```ts
import { unauthorized } from "remix-utils/server";
import type { LoaderFunction } from "remix";

export loader: LoaderFunction = async () => {
  // usually what you really want is to throw a redirect to the login page
  throw unauthorized({ message: "You need to login." });
}
```

#### Forbidden

Helper function to create a Forbidden (403) response with a JSON body.

```ts
import { forbidden } from "remix-utils/server";
import type { LoaderFunction } from "remix";

export loader: LoaderFunction = async () => {
  throw forbidden({ message: "You don't have access for this." });
}
```

#### Not Found

Helper function to create a Not Found (404) response with a JSON body.

```ts
import { notFound } from "remix-utils/server";
import type { LoaderFunction } from "remix";

export loader: LoaderFunction = async () => {
  throw notFound({ message: "This doesn't exists." });
}
```

#### Unprocessable Entity

Helper function to create a Unprocessable Entity (422) response with a JSON body.

```ts
import { unprocessableEntity } from "remix-utils/server";
import type { LoaderFunction } from "remix";

export loader: LoaderFunction = async () => {
  throw unprocessableEntity({ message: "This doesn't exists." });
}
```

This is used by the CSRF validation, you probably don't want to use it directly.

#### Server Error

Helper function to create a Server Error (500) response with a JSON body.

```ts
import { serverError } from "remix-utils/server";
import type { LoaderFunction } from "remix";

export loader: LoaderFunction = async () => {
  throw serverError({ message: "Something unexpected happened." });
}
```

## Author

- [Sergio Xalambrí](https://sergiodxa.com)

## License

- MIT License
