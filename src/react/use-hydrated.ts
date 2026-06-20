/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/use-hydrated`.
 *
 * > [!NOTE]
 * > This depends on `react`.
 *
 * This hook lets you detect if your component is already hydrated. This means the JS for the element loaded client-side and React is running.
 *
 * With useHydrated, you can render different things on the server and client while ensuring the hydration will not have a mismatched HTML.
 *
 * ```ts
 * import { useHydrated } from "remix-utils/use-hydrated";
 *
 * export function Component() {
 *   let isHydrated = useHydrated();
 *
 *   if (isHydrated) {
 *     return <ClientOnlyComponent />;
 *   }
 *
 *   return <ServerFallback />;
 * }
 * ```
 *
 * When doing SSR, the value of `isHydrated` will always be `false`. The first client-side render `isHydrated` will still be false, and then it will change to `true`.
 *
 * After the first client-side render, future components rendered calling this hook will receive `true` as the value of `isHydrated`. This way, your server fallback UI will never be rendered on a route transition.
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Hook/Use Hydrated
 */
import { useSyncExternalStore } from "react";

function subscribe() {
	// biome-ignore lint/suspicious/noEmptyBlockStatements: Mock function
	return () => {};
}

/**
 * Return a boolean indicating if the JS has been hydrated already.
 * When doing Server-Side Rendering, the result will always be false.
 * When doing Client-Side Rendering, the result will always be false on the
 * first render and true from then on. Even if a new component renders it will
 * always start with true.
 *
 * Example: Disable a button that needs JS to work.
 * ```tsx
 * let hydrated = useHydrated();
 * return (
 *   <button type="button" disabled={!hydrated} onClick={doSomethingCustom}>
 *     Click me
 *   </button>
 * );
 * ```
 */
export function useHydrated() {
	return useSyncExternalStore(
		subscribe,
		() => true,
		() => false,
	);
}
