import { Outlet as RemixOutlet } from "@remix-run/react";
import { createContext, useContext } from "react";

type OutletProps<Data> = { data?: Data };

let context = createContext<unknown>(null);

/**
 * Wrapper of the React Router Outlet component. This Outlet receives an
 * optional `data` prop and wraps the RR Outlet in a React Context passing this
 * data as value.
 *
 * ```tsx
 * let data = useLoaderData(); // get data from the current route
 * return <Outlet data={data} /> // pass data to the Outlet
 * ```
 */
export function Outlet<Data = unknown>({ data }: OutletProps<Data>) {
  return (
    <context.Provider value={data}>
      <RemixOutlet />
    </context.Provider>
  );
}

/**
 * Get the data from the parent data. This needs to be rendered in a route with
 * a parent router rendering the Outlet component of Remix Utils.
 * ```tsx
 * let routeData = useLoaderData(); // get data from the route loader
 * let parentData = useParentData(); // get data from the parent route
 * ```
 */
export function useParentData<ParentData>() {
  let parentData = useContext(context) as ParentData | null;
  if (!parentData) throw new Error("Missing parent data.");
  return parentData;
}
