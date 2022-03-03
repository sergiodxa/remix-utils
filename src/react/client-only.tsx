import { ReactNode } from "react";
import { useHydrated } from "./use-hydrated";

/**
 * @deprecated Pass a function as children to avoid issues with client only
 * imported components
 */
type DeprecatedProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type Props =
  | DeprecatedProps
  | {
      /**
       * You are encouraged to add a fallback that is the same dimensions
       * as the client rendered children. This will avoid content layout
       * shift which is disgusting
       */
      children: () => ReactNode;
      fallback?: ReactNode;
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
  if (typeof children !== "function") {
    console.warn(
      "[remix-utils] ClientOnly: Pass a function as children to avoid issues with client-only imported components"
    );
  }

  return useHydrated() ? (
    <>{typeof children === "function" ? children() : children}</>
  ) : (
    <>{fallback}</>
  );
}
