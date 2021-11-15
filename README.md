# Remix Utils

This package contains simple utility functions to use with [Remix.run](https://remix.run).

## Installation

```bash
npm install remix-utils remix @remix-run/node @remix-run/react react
```

## API Reference

### ClientOnly

The ClientOnly component lets you render the children element only on the client-side, avoiding rendering it the server-side.

You can, optionally, provide a fallback component to be used on SSR.

```tsx
import { ClientOnly } from "remix-utils";

export default function View() {
  return (
    <ClientOnly fallback={<SimplerStaticVersion />}>
      <ComplexComponentNeedingBrowserEnvironment />
    </ClientOnly>
  );
}
```

This component is handy when you have some complex component that needs a browser environment to work, like a chart or a map. This way, you can avoid rendering it server-side and instead use a simpler static version like an SVG or even a loading UI.

The rendering flow will be:

- SSR: Always render the fallback.
- CSR First Render: Always render the fallback.
- CSR Update: Update to render the actual component.
- CSR Futur Renders: Always render the actual component, don't bother to render the fallback.

This component uses the `useHydrated` hook internally.

### CSRF

The CSRF related functions let you implement CSRF protection on your application.

This part of Remix Utils needs packages from `remix-utils` and `remix-utils` to work.

#### Generate the authenticity token

In the server, we need to add to our `root` component the following.

```ts
import type { LoaderFunction } from "remix";
import { createAuthenticityToken, json } from "remix-utils";
import { getSession, commitSession } from "~/services/session.server";

interface LoaderData {
  csrf: string;
}

export let loader: LoaderFunction = async ({ request }) => {
  let session = await getSession(request.headers.get("cookie"));
  let token = createAuthenticityToken(session);
  return json<LoaderData>(
    { csrf: token },
    {
      headers: await commitSession(session),
    }
  );
};
```

The `createAuthenticityToken` function receives a session object and stores the authenticity token there using the `csrf` key (you can pass the key name as a second argument). Finally, you need to return the token in a `json` response and commit the session.

#### Render the AuthenticityTokenProvider

You need to read the authenticity token and render the `AuthenticityTokenProvider` component wrapping your code in your root.

```tsx
import { Outlet, useLoaderData } from "remix";
import { Document } from "~/components/document";

export default function Root() {
  let { csrf } = useLoaderData<LoaderData>();
  return (
    <AuthenticityTokenProvider value={csrf}>
      <Document>
        <Outlet />
      </Document>
    </AuthenticityTokenProvider>
  );
}
```

With this, your whole app can access the authenticity token generated in the root.

#### Rendering a Form

When you create a form in some route, you can use the `AuthenticityTokenInput` component to add the authenticity token to the form.

```tsx
import { Form } from "remix";
import { AuthenticityTokenInput } from "remix-utils";

export default function SomeRoute() {
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

##### Alternative: Using `useAuthenticityToken` and `useFetcher`.

If you need to use `useFetcher` (or `useSubmit`) instead of `Form` you can also get the authenticity token with the `useAuthenticityToken` hook.

```tsx
import { useFetcher } from "remix";
import { useAuthenticityToken } from "remix-utils";

export function useMarkAsRead() {
  let fetcher = useFetcher();
  let csrf = useAuthenticityToken();
  return function submit(data) {
    fetcher.submit({ csrf, ...data }, { action: "/action", method: "post" });
  };
}
```

#### Verify in the Action

Finally, you need to verify the authenticity token in the action you received the request.

```ts
import type { ActionFunction } from "remix";
import { verifyAuthenticityToken, redirectBack } from "remix-utils";
import { getSession, commitSession } from "~/services/session.server";

export let action: ActionFunction = async ({ request }) => {
  let session = await getSession(request.headers.get("Cookie"));
  await verifyAuthenticityToken(session);
  // do something here
  return redirectBack(request, { fallback: "/fallback" });
};
```

Suppose the authenticity token is missing on the session, the request body, or doesn't match. In that case, the function will throw an Unprocessable Entity response that you can either catch and handle manually or let pass and render your CatchBoundary.

### Outlet & useParentData

This wrapper of the Remix Outlet component lets you pass an optional `data` prop, then using the `useParentData` hook, you can access that data.

Helpful to pass information from parent to child routes, for example, the authenticated user data.

```tsx
// parent route
import { Outlet } from "remix-utils";

export default function Parent() {
  return <Outlet data={{ something: "here" }} />;
}
```

```tsx
// child route
import { useParentData } from "remix-utils";

export default function Child() {
  const data = useParentData();
  return <div>{data.something}</div>;
}
```

### RevalidateLink

The RevalidateLink link components it's a simple wrapper of a Remix's Link, it receives the same props with the exception of the `to`, instead this component will render a Link to `.`.

Because of linking to `.`, when clicked, this will tell Remix to fetch again the loaders of the current routes, but instead of creating a new entry on the browser's history stack, it will replace the current one, basically, it will refresh the page, but only reloading the data.

If you don't have JS enabled, this will do a full page refresh instead, giving you the exact same behavior.

```tsx
<RevalidateLink className="refresh-btn-styles">Refresh</RevalidateLink>
```

### useHydrated

This lets you detect if your component is already hydrated. This means the JS for the element loaded client-side and React is running.

With useHydrated, you can render different things on the server and client while ensuring the hydration will not have a mismatched HTML.

```ts
import { useHydrated } from "remix-utils";

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

### useRevalidate

This Hook gives you a function you can call to trigger a revalidation of the loaders in the current routes.

The way this works is by navigating to `.` and adding `replace: true` to avoid creating a new entry on the history stack.

> Check #RevalidateLink for more information and a component version of this feature that works without JS.

This Hooks is mostly useful if you want to trigger the revalidation manually from an effect, examples of this are:

- Set an interval to trigger the revalidation
- Revalidate when the browser tab is focused again
- Revalidate when the user is online again

```ts
import { useRevalidate } from "remix-utils";

function useRevalidateOnInterval() {
  let revalidate = useRevalidat();
  useEffect(() => {
    let interval = setInterval(revalidate, 5000);
    return () => clearInterval(interval);
  }, [revalidate]);
}
```

### useShouldHydrate

If you are building a Remix application where most routes are static, and you want to avoid loading client-side JS, you can use this hook, plus some conventions, to detect if one or more active routes needs JS and only render the Scripts component in that case.

In your document component, you can call this hook to dynamically render the Scripts component if needed.

```tsx
import type { ReactNode } from "react";
import { Links, LiveReload, Meta, Scripts } from "remix";
import { useShouldHydrate } from "remix-utils";

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
        {process.env.NODE_ENV === "development" && <LiveReload />}
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
  hydate(data: LoaderData) {
    return data.user.isAuthenticated;
  },
};
```

The `useShouldHydrate` hook will detect `hydrate` as a function and call it using the route data.

### Body Parser

These utilities let you parse the request body with a simple function call. You can parse it to a string, a URLSearchParams instance, or an object.

#### toString

This function receives the whole request and returns a promise with the body as a string.

```ts
import { bodyParser, redirectBack } from "remix-utils";
import type { ActionFunction } from "remix";

import { updateUser } from "../services/users";

export let action: ActionFunction = async ({ request }) => {
  let body = await bodyParser.toString(request);
  body = new URLSearchParams(body);
  await updateUser(params.id, { username: body.get("username") });
  return redirectBack(request, { fallback: "/" });
};
```

#### toSearchParams

This function receives the whole request and returns a promise with an instance of `URLSearchParams`, and the request's body is already parsed.

```ts
import { bodyParser, redirectBack } from "remix-utils";
import type { ActionFunction } from "remix";

import { updateUser } from "../services/users";

export let action: ActionFunction = async ({ request, params }) => {
  const body = await bodyParser.toSearchParams(request);
  await updateUser(params.id, { username: body.get("username") });
  return redirectBack(request, { fallback: "/" });
};
```

This is the same as doing:

```ts
let body = await bodyParser.toString(request);
return new URLSearchParams(body);
```

#### toJSON

This function receives the whole request and returns a promise with an unknown value. That value is going to be the body of the request.

The result is typed as `unknown` to force you to validate the object to ensure it's what you expect. This is because there's no way for TypeScript to know what the type of the body is since it's an entirely dynamic value.

```ts
import { bodyParser, redirectBack } from "remix-utils";
import type { ActionFunction } from "remix";
import { hasUsername } from "../validations/users";
import { updateUser } from "~/services/users";

export let action: ActionFunction = async ({ request }) => {
  const body = await bodyParser.toJSON(request);
  hasUsername(body); // this should throw if body doesn't have username
  // from this point you can do `body.username`
  await updateUser(params.id, { username: body.username });
  return redirectBack(request, { fallback: "/" });
};
```

This is the same as doing:

```ts
let body = await bodyParser.toSearchParams(request);
return Object.fromEntries(params.entries()) as unknown;
```

### Responses

#### Typed JSON

This function is a typed version of the `json` helper provided by Remix. It accepts a generic with the type of data you are going to send in the response.

This helps ensure that the data you are sending from your loader matches the provided type at the compiler lever. It's more useful when you create an interface or type for your loader so you can share it between `json` and `useLoaderData` to help you avoid missing or extra parameters in the response.

Again, this is not doing any kind of validation on the data you send. It's just a type checker.

The generic extends JsonValue from [type-fest](https://github.com/sindresorhus/type-fest/blob/ff96fef37b84137e1600eebce108c2b797427c1f/source/basic.d.ts#L45), this limit the type of data you can send to anything that can be serializable, so you are not going to be able to send BigInt, functions, Symbols, etc. If `JSON.stringify` fails to try to stringify that value, it will not be supported.

```tsx
import { useLoaderData } from "remix";
import type { LoaderFunction } from "remix";
import { json } from "remix-utils";

import { getUser } from "../services/users";
import type { User } from "../types";

interface LoaderData {
  user: User;
}

export let loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request);
  return json<LoaderData>({ user });
};

export default function View() {
  const { user } = useLoaderData<LoaderData>();
  return <h1>Hello, {user.name}</h1>;
}
```

#### Redirect Back

This function is a wrapper of the `redirect` helper from Remix, contrarian to Remix's version. This one receives the whole request object as the first value and an object with the response init and a fallback URL.

The response created with this function will have the `Location` header pointing to the `Referer` header from the request, or if not available, the fallback URL provided in the second argument.

```ts
import { redirectBack } from "remix-utils";
import type { ActionFunction } from "remix";

export let action: ActionFunction = async ({ request }) => {
  await redirectBack(request, { fallback: "/" });
};
```

This helper is more useful when used in a generic action to send the user to the same URL it was before.

#### Bad Request

Helper function to create a Bad Request (400) response with a JSON body.

```ts
import { badRequest } from "remix-utils";
import type { ActionFunction } from "remix";

export let action: ActionFunction = async () => {
  throw badRequest({ message: "You forgot something in the form." });
};
```

#### Unauthorized

Helper function to create an Unauthorized (401) response with a JSON body.

```ts
import { unauthorized } from "remix-utils";
import type { LoaderFunction } from "remix";

export let loader: LoaderFunction = async () => {
  // usually what you really want is to throw a redirect to the login page
  throw unauthorized({ message: "You need to login." });
};
```

#### Forbidden

Helper function to create a Forbidden (403) response with a JSON body.

```ts
import { forbidden } from "remix-utils";
import type { LoaderFunction } from "remix";

export let loader: LoaderFunction = async () => {
  throw forbidden({ message: "You don't have access for this." });
};
```

#### Not Found

Helper function to create a Not Found (404) response with a JSON body.

```ts
import { notFound } from "remix-utils";
import type { LoaderFunction } from "remix";

export let loader: LoaderFunction = async () => {
  throw notFound({ message: "This doesn't exists." });
};
```

#### Unprocessable Entity

Helper function to create an Unprocessable Entity (422) response with a JSON body.

```ts
import { unprocessableEntity } from "remix-utils";
import type { LoaderFunction } from "remix";

export let loader: LoaderFunction = async () => {
  throw unprocessableEntity({ message: "This doesn't exists." });
};
```

This is used by the CSRF validation. You probably don't want to use it directly.

#### Server Error

Helper function to create a Server Error (500) response with a JSON body.

```ts
import { serverError } from "remix-utils";
import type { LoaderFunction } from "remix";

export let loader: LoaderFunction = async () => {
  throw serverError({ message: "Something unexpected happened." });
};
```

## Author

- [Sergio Xalambrí](https://sergiodxa.com)

## License

- MIT License
