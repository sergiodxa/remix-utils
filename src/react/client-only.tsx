/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/client-only`.
 *
 * > [!NOTE]
 * > This depends on `react`.
 *
 * The ClientOnly component lets you render the children element only on the client-side, avoiding rendering it the server-side.
 *
 * You can provide a fallback component to be used on SSR, and while optional, it's highly recommended to provide one to avoid content layout shift issues.
 *
 * ```tsx
 * import { ClientOnly } from "remix-utils/client-only";
 *
 * export default function Component() {
 * 	return (
 * 		<ClientOnly fallback={<SimplerStaticVersion />}>
 * 			{() => <ComplexComponentNeedingBrowserEnvironment />}
 * 		</ClientOnly>
 * 	);
 * }
 * ```
 *
 * This component is handy when you have some complex component that needs a browser environment to work, like a chart or a map. This way, you can avoid rendering it server-side and instead use a simpler static version like an SVG or even a loading UI.
 *
 * The rendering flow will be:
 *
 * - SSR: Always render the fallback.
 * - CSR First Render: Always render the fallback.
 * - CSR Update: Update to render the actual component.
 * - CSR Future Renders: Always render the actual component, don't bother to render the fallback.
 *
 * This component uses the `useHydrated` hook internally.
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Component/Client Only
 */
import * as React from "react";
import { useHydrated } from "./use-hydrated.js";

type Props = {
	/**
	 * You are encouraged to add a fallback that is the same dimensions
	 * as the client rendered children. This will avoid content layout
	 * shift which is disgusting
	 */
	children(): React.ReactNode;
	fallback?: React.ReactNode;
};

/**
 * Render the children only after the JS has loaded client-side. Use an optional
 * fallback component if the JS is not yet loaded.
 *
 * Example: Render a Chart component if JS loads, renders a simple FakeChart
 * component server-side or if there is no JS. The FakeChart can have only the
 * UI without the behavior or be a loading spinner or skeleton.
 * ```tsx
 * return (
 *   <ClientOnly fallback={<FakeChart />}>
 *     {() => <Chart />}
 *   </ClientOnly>
 * );
 * ```
 */
export function ClientOnly({ children, fallback = null }: Props) {
	return useHydrated() ? children() : fallback;
}
