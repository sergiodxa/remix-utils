/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/server-only`.
 *
 * > [!NOTE]
 * > This depends on `react`.
 *
 * The ServerOnly component is the opposite of the ClientOnly component, it lets you render the children element only on the server-side, avoiding rendering it the client-side.
 *
 * You can provide a fallback component to be used on CSR, and while optional, it's highly recommended to provide one to avoid content layout shift issues, unless you only render visually hidden elements.
 *
 * ```tsx
 * import { ServerOnly } from "remix-utils/server-only";
 *
 * export default function Component() {
 * 	return (
 * 		<ServerOnly fallback={<ComplexComponentNeedingBrowserEnvironment />}>
 * 			{() => <SimplerStaticVersion />}
 * 		</ServerOnly>
 * 	);
 * }
 * ```
 *
 * This component is handy to render some content only on the server-side, like a hidden input you can later use to know if JS has loaded.
 *
 * Consider it like the `<noscript>` HTML tag but it can work even if JS failed to load but it's enabled on the browser.
 *
 * The rendering flow will be:
 *
 * - SSR: Always render the children.
 * - CSR First Render: Always render the children.
 * - CSR Update: Update to render the fallback component (if defined).
 * - CSR Future Renders: Always render the fallback component, don't bother to render the children.
 *
 * This component uses the `useHydrated` hook internally.
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Component/Server Only
 */
import * as React from "react";
import { useHydrated } from "./use-hydrated.js";

type Props = {
	/**
	 * You are encouraged to add a fallback that is the same dimensions
	 * as the server rendered children. This will avoid content layout
	 * shift which is disgusting
	 */
	children(): React.ReactNode;
	fallback?: React.ReactNode;
};

/**
 * Render the children only before the JS has loaded client-side. Use an
 * optional fallback component for once the JS has loaded.
 *
 * Example: Render a hidden input to identify if the user has JS.
 * ```tsx
 * return (
 *   <ServerOnly fallback={<FakeChart />}>
 *     {() => <Chart />}
 *   </ServerOnly>
 * );
 * ```
 */
export function ServerOnly({ children, fallback = null }: Props) {
	return useHydrated() ? fallback : children();
}
