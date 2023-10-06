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
	return useHydrated() ? <>{fallback}</> : <>{children()}</>;
}
