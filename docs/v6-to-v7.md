---
title: Upgrade from v6 to v7
---

# Upgrade from Remix Utils v6

> [!TIP]
> This guide only matters if you're using Remix and you want to upgrade from Remix Utils v6 to v7.

If you used Remix Utils before, you will notice some changes.

1. The package is published as ESM only
2. Every util now has a specific path in the package, so you need to import them from `remix-utils/<util-name>`.
3. All dependencies are now optional, so you need to install them yourself.

## Usage with CJS

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

## Updated Import Paths

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

## Optional Dependencies

Before, Remix Utils installed some dependencies like Zod that you may never used.

Current version marks every dependency as optional, so you need to install them yourself.

While this is more works it means the package can keep using more dependencies as needed without increasing the bundle size for everyone. Only if you use the dependency that depends on Zod you will install and include Zod in your bundle.

Every util mentions what dependencies it requires and the [Installation](#installation) section mentions the whole list in case you want to install them all upfront.
