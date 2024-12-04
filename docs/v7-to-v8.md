---
title: Upgrade from v7 to v8
---

# Upgrade from Remix Utils v7

> [!TIP]
> This guide only matters if you're using Remix and you want to upgrade from Remix Utils v7 to v8.

The Remix Utils v8 package is not compatible anymore with Remix v1 or v2, instead it requires you to use React Router v7, and some utils may require you to use the framework mode of RRv7.

If you're on the process of migrating from Remix to RRv7, upgrade also Remix Utils to v8.

Then remove any `@remix-run/*` package you have. After that you should be good to go.

Note the following breaking changes:

## namedAction

If you're using namedAction util, note that it has dropped support for receiving a URL, URLSearchParams or Request objects, and now only accepts a FormData.

It also only support the field `intent` for the action name, if you were using `?/action-name` or `action` or `_action`, that won't work anymore.

## wait

If you were using the `wait` timer util, that was removed, instead use `setTimeout` from `node:timers/promise`.

```diff
- import { wait } from 'remix-utils/timers"
+ import { setTimeout } from 'node:timers/promise'
```

And then in the usage:

```diff
- await wait(1000, { signal })
+ await setTimeout(1000, void 0, { signal })
```
