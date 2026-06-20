/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/external-scripts`.
 *
 * > [!NOTE]
 * > This depends on `react`, and `react-router`.
 *
 * If you need to load different external scripts on certain routes, you can use the `ExternalScripts` component together with the `ExternalScriptsFunction` and `ScriptDescriptor` types.
 *
 * In the route you want to load the script add a `handle` export with a `scripts` method, type the `handle` to be `ExternalScriptsHandle`. This interface is let's you define `scripts` as either a function or an array.
 *
 * If you want to define what scripts to load based on the loader data, you can use `scripts` as a function:
 *
 * ```ts
 * import { ExternalScriptsHandle } from "remix-utils/external-scripts";
 *
 * type LoaderData = SerializeFrom<typeof loader>;
 *
 * export let handle: ExternalScriptsHandle<LoaderData> = {
 *   scripts({ id, data, params, matches, location, parentsData }) {
 *     return [
 *       {
 *         src: "https://unpkg.com/htmx.org@1.9.6",
 *         integrity: "sha384-FhXw7b6AlE/jyjlZH5iHa/tTe9EpJ1Y55RjcgPbjeWMskSxZt1v9qkxLJWNJaGni",
 *         crossOrigin: 'anonymous"
 *       }
 *     ];
 *   },
 * };
 * ```
 *
 * If the list of scripts to load is static you can define `scripts` as an array directly.
 *
 * ```ts
 * import { ExternalScriptsHandle } from "remix-utils/external-scripts";
 *
 * export let handle: ExternalScriptsHandle = {
 *   scripts: [
 *     {
 *       src: "https://unpkg.com/htmx.org@1.9.6",
 *       integrity: "sha384-FhXw7b6AlE/jyjlZH5iHa/tTe9EpJ1Y55RjcgPbjeWMskSxZt1v9qkxLJWNJaGni",
 *       crossOrigin: 'anonymous",
 *       preload: true, // use it to render a <link rel="preload"> for this script
 *     }
 *   ],
 * };
 * ```
 *
 * You can also import `ExternalScriptsFunction` and `ScriptDescriptor` interfaces yourself to build a custom handle type.
 *
 * ```ts
 * import { ExternalScriptsFunction, ScriptDescriptor } from "remix-utils/external-scripts";
 *
 * interface AppHandle<LoaderData = unknown> {
 * 	scripts?: ExternalScriptsFunction<LoaderData> | ScriptDescriptor[];
 * }
 *
 * export let handle: AppHandle<LoaderData> = {
 * 	scripts, // define scripts as a function or array here
 * };
 * ```
 *
 * Or you can extend the `ExternalScriptsHandle` interface.
 *
 * ```ts
 * import { ExternalScriptsHandle } from "remix-utils/external-scripts";
 *
 * interface AppHandle<LoaderData = unknown> extends ExternalScriptsHandle<LoaderData> {
 * 	// more handle properties here
 * }
 *
 * export let handle: AppHandle<LoaderData> = {
 * 	scripts, // define scripts as a function or array here
 * };
 * ```
 *
 * ---
 *
 * Then, in the root route, add the `ExternalScripts` component somewhere, usually you want to load it either inside `<head>` or at the bottom of `<body>`, either before or after the Remix's `<Scripts>` component.
 *
 * Where exactly to place `<ExternalScripts />` will depend on your app, but a safe place is at the end of `<body>`.
 *
 * ```tsx
 * import { Links, LiveReload, Meta, Scripts, ScrollRestoration } from "remix";
 * import { ExternalScripts } from "remix-utils/external-scripts";
 *
 * type Props = { children: React.ReactNode; title?: string };
 *
 * export function Document({ children, title }: Props) {
 * 	return (
 * 		<html lang="en">
 * 			<head>
 * 				<meta charSet="utf-8" />
 * 				<meta name="viewport" content="width=device-width,initial-scale=1" />
 * 				{title ? <title>{title}</title> : null}
 * 				<Meta />
 * 				<Links />
 * 			</head>
 * 			<body>
 * 				{children}
 * 				<ScrollRestoration />
 * 				<ExternalScripts />
 * 				<Scripts />
 * 				<LiveReload />
 * 			</body>
 * 		</html>
 * 	);
 * }
 * ```
 *
 * Now, any script you defined in the ScriptsFunction will be added to the HTML.
 *
 * You could use this util together with `useShouldHydrate` to disable Remix scripts in certain routes but still load scripts for analytics or small features that need JS but don't need the full app JS to be enabled.
 *
 * ```tsx
 * let shouldHydrate = useShouldHydrate();
 *
 * return (
 * 	<html lang="en">
 * 		<head>
 * 			<meta charSet="utf-8" />
 * 			<meta name="viewport" content="width=device-width,initial-scale=1" />
 * 			{title ? <title>{title}</title> : null}
 * 			<Meta />
 * 			<Links />
 * 		</head>
 * 		<body>
 * 			{children}
 * 			<ScrollRestoration />
 * 			{shouldHydrate ? <Scripts /> : <ExternalScripts />}
 * 			<LiveReload />
 * 		</body>
 * 	</html>
 * );
 * ```
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Component/External Scripts
 */
import type { Location, Params, RouterState, useMatches } from "react-router";

export type HandleConventionArguments<Data = unknown> = {
	id: string;
	data: Data;
	params: Params;
	matches: ReturnType<typeof useMatches>;
	location: Location;
	parentsData: RouterState["loaderData"];
};
