# Remix Utils

This package contains simple utility functions and types to use together with [Remix.run](https://remix.run).

**This package requires Remix which needs a paid license to install it**

## Installation

```bash
yarn add remix-utils
npm install remix-utils
```

Remember you need to also install `remix`, `@remix-run/node`, `@remix-run/react` and `react`. For the first three you need a paid Remix license.

## Imports

```ts
import { redirectBack, parseBody, json } from "remix-utils";
import type {
  LoaderArgs,
  LoaderReturn,
  ActionArgs,
  ActionReturn,
  LinksArgs,
  LinksReturn,
  MetaArgs,
  MetaReturn,
  HeadersArgs,
  HeadersReturn,
} from "remix-utils";
```

## API

### `redirectBack`

This function is a wrapper of the `redirect` helper from Remix, contrarian to Remix's version this one receives the whole request object as first value and an object with the response init and a fallback URL.

The response created with this function will have the `Location` header pointing to the `Referer` header from the request, or if not available the fallback URL provided in the second argument.

```ts
import { redirectBack } from "remix-utils";
import type { ActionArgs, ActionReturn } from "remix-utils";

export function action({ request }: ActionArgs): ActionReturn {
  return redirectBack(request, { fallback: "/" });
}
```

This helper is more useful when used in an action so you can send the user to the same URL it was before.

### `parseBody`

This function receives the whole request and returns a promise with an instance of `URLSearchParams`, and the body of the request already parsed.

```ts
import { parseBody, redirectBack } from "remix-utils";
import type { ActionArgs, ActionReturn } from "remix-utils";

import { updateUser } from "../services/users";

export function action({ request, params }: ActionArgs): ActionReturn {
  const body = await parseBody(request);
  await updateUser(params.id, { username: body.get("username") });
  return redirectBack(request, { fallback: "/" });
}
```

This is a simple wrapper over doing `new URLSearchParams(await request.text());`.

### `json`

This function is a typed version of the `json` helper provided by Remix, it accepts a generic (defaults to `unknown`) and ensure at the compiler lever that the data you are sending from your loader matches the provided type. It's more useful when you create a type or interface for your whole route so you can share it between `json` and `useRouteData` to ensure you are not missing or adding extra parameters to the response.

```tsx
import { useRouteData } from "remix";
import { json } from "remix-utils";
import type { LoaderArgs, LoaderReturn } from "remix-utils";

import { getUser } from "../services/users";
import type { User } from "../types";

interface RouteData {
  user: User;
}

export async function loader({ request }: LoaderArgs): LoaderReturn {
  const user = await getUser(request);
  return json<RouteData>({ user });
}

export default function View() {
  const { user } = useRouteData<RouteData>();
  return <h1>Hello, {user.name}</h1>;
}
```

### Types

This package exports a list of useful types together with the utility functions, you can import them with

```ts
import type {
  LoaderArgs,
  LoaderReturn,
  ActionArgs,
  ActionReturn,
  LinksArgs,
  LinksReturn,
  MetaArgs,
  MetaReturn,
  HeadersArgs,
  HeadersReturn,
} from "remix-utils";
```

This types are generated from the `LoaderFunction`, `ActionFunction`, `LinksFunction`, `MetaFunction` and `HeadersFunction` exported by Remix itself, this ensure they will be up to date with your Remix version.

All the `*Args` types are the first argument of the equivalent `*Funtion` type.
All the `*Return` types are the return type of the equivalent `*Funtion` type.

They are exported in case you don't want to use arrow functions (like me) and still want the types so instead of doing:

```ts
export const loader: LoaderFunction = async (args) => {};
```

You can do:

```ts
export async function loader(args: LoaderArgs): LoaderReturn {}
```

Since all of them are TypeScript types they will not impact your bundle size in case you prefer to use the normal `*Function` types from Remix.

## Author

- [Sergio Xalambrí](https://sergiodxa.com)

## License

- MIT License

