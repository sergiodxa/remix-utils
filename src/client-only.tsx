import * as React from 'react';
import { useHydrated } from './use-hydrated';

type Props = {
  children: React.ReactNode;
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
 *     <Chart />
 *   </ClientOnly>
 * );
 * ```
 */
export function ClientOnly({ children, fallback = null }: Props) {
  return useHydrated() ? <>{children}</> : <>{fallback}</>;
}
