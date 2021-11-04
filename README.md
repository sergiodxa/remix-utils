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

WIP

### CSRF

WIP

### Outlet

WIP

### useHydrated

WIP

### useShouldHydrate

WIP

### Body Parser

#### toParams

This function receives the whole request and returns a promise with an instance of `URLSearchParams`, and the body of the request already parsed.

```ts
import { bodyParser, redirectBack } from "remix-utils/server";
import type { ActionFunction } from "remix";

import { updateUser } from "../services/users";

export let action: ActionFunction = async ({ request }) => {
  const body = await bodyParser.toParams(request);
  await updateUser(params.id, { username: body.get("username") });
  return redirectBack(request, { fallback: "/" });
}
```

This is a simple wrapper over doing `new URLSearchParams(await request.text());`.

#### toJSON

This function receives the whole request and returns a promise with an unknown value, that value is going to be the body of the request.

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

This is a simple wrapper over doing `new URLSearchParams(await request.text());`.

### Responses

#### Typed JSON

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

#### Redirect Back

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

#### Bad Request

WIP

#### Unauthorized

WIP

#### Forbidden

WIP

#### Not Found

WIP

#### Unprocessable Entity

WIP

#### Server Error

WIP

## Author

- [Sergio Xalambrí](https://sergiodxa.com)

## License

- MIT License
