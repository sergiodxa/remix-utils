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
import * as React from "react";
import { useLocation, useMatches } from "react-router";
import type { HandleConventionArguments } from "./handle-conventions.js";
import { useHydrated } from "./use-hydrated.js";

export type ReferrerPolicy =
	| "no-referrer-when-downgrade"
	| "no-referrer"
	| "origin-when-cross-origin"
	| "origin"
	| "same-origin"
	| "strict-origin-when-cross-origin"
	| "strict-origin"
	| "unsafe-url";

export type CrossOrigin = "anonymous" | "use-credentials";

export type ScriptType = "module" | "text/javascript";

export type ScriptDescriptor = {
	/** Enable preloading of this script on SSR */
	preload?: boolean;
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#async
	 */
	async?: boolean;
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-crossorigin
	 */
	crossOrigin?: CrossOrigin;
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-defer
	 */
	defer?: boolean;
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-integrity
	 */
	integrity?: string;
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-nomodule
	 */
	noModule?: boolean;
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-nonce
	 */
	nonce?: string;
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-referrerpolicy
	 */
	referrerPolicy?: ReferrerPolicy;
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-src
	 */
	src: string;
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-type
	 */
	type?: ScriptType;
	/**
	 * Optional element ID. Use only if the script element needs to be explicitly referenced later.
	 */
	id?: string;
};

export type ExternalScriptsFunction<Loader = unknown> = (
	args: HandleConventionArguments<Loader>,
) => ScriptDescriptor[];

/**
 * Define the shape of the `handle` export if you want to use `scripts`. Combine
 * it with your own `handle` type to add `scripts` to your route.
 * @description Add a scripts function that access the route's loader data
 * @example
 * export const handle: ExternalScriptsHandle<SerializeFrom<typeof loader>> = {
 *   scripts(loaderData) { ... }
 * }
 * @description Add a static scripts array
 * @example
 * export const handle: ExternalScriptsHandle = {
 *   scripts: [...]
 * }
 * @description Extend it with your own handle type
 * @example
 * interface Handle<Data = unknown> extends ExternalScriptsHandle<Data> {
 *   // extra things here
 * }
 * export const handle: Handle = {
 *   scripts, // define scripts here
 *   // and any other handle properties here
 * }
 */
export interface ExternalScriptsHandle<Data = unknown> {
	scripts?: ExternalScriptsFunction<Data> | ScriptDescriptor[];
}

/**
 * Load scripts defined by each route in a single place, often in `root`.
 * @example
 * // Defines a `scripts` function in a route `handle`
 * export const handle: ExternalScriptsHandle<SerializeFrom<typeof loader>> = {
 *   scripts(loaderData) { ... }
 * }
 * // Or define a scripts array directly
 * export const handle: ExternalScriptsHandle = {
 *   scripts: [...]
 * }
 * // Then render ExternalScripts in your root
 * return <ExternalScripts />
 */
export function ExternalScripts({ nonce }: { nonce?: string }) {
	let scripts = useExternalScripts();

	return (
		<>
			{scripts.map((props) => {
				return <ExternalScript key={props.src} {...props} nonce={nonce} />;
			})}
		</>
	);
}

export function useExternalScripts() {
	let location = useLocation();

	let matches = useMatches();

	return React.useMemo(() => {
		let scripts = matches.flatMap((match, index, matches) => {
			if (!match.handle) return []; // ignore no-handle routes
			if (match.handle === null) return []; // ignore null handles
			if (typeof match.handle !== "object") return []; // and non error handles
			if (!("scripts" in match.handle)) return []; // and without scripts

			let scripts = match.handle.scripts as ExternalScriptsFunction | ScriptDescriptor[];

			// if scripts is an array, suppose it's an array of script descriptors
			// and return it
			if (Array.isArray(scripts)) return scripts;

			// if it's not a function (and not an array), ignore it
			if (typeof scripts !== "function") return [];

			let result = scripts({
				id: match.id,
				data: match.data,
				params: match.params,
				location,
				parentsData: matches.slice(0, index).map((match) => match.data),
				matches,
			});

			if (Array.isArray(result)) return result;
			return [];
		});

		let uniqueScripts = new Map();
		for (let script of scripts) uniqueScripts.set(script.src, script);
		return [...uniqueScripts.values()];
	}, [matches, location]);
}

export function ExternalScript({
	src,
	preload = false,
	async = true,
	defer = true,
	crossOrigin,
	integrity,
	type,
	referrerPolicy,
	noModule,
	nonce,
	id,
}: ScriptDescriptor) {
	let isHydrated = useHydrated();
	let startsHydrated = React.useRef(isHydrated);

	React.useEffect(() => {
		if (!startsHydrated.current && isHydrated) return;

		let $script = document.createElement("script");
		$script.src = src;

		let attributes = {
			async,
			defer,
			crossOrigin,
			integrity,
			type,
			referrerPolicy,
			noModule,
			nonce,
			id,
		};

		for (let [key, value] of Object.entries(attributes)) {
			if (value) $script.setAttribute(key, value.toString());
		}

		document.body.appendChild($script);

		return () => $script.remove();
	}, [
		async,
		crossOrigin,
		defer,
		integrity,
		isHydrated,
		noModule,
		nonce,
		referrerPolicy,
		src,
		type,
		id,
	]);

	if (startsHydrated.current && isHydrated) return null;

	let rel = noModule ? "modulepreload" : "preload";
	let as = noModule ? undefined : "script";

	return (
		<>
			{preload && (
				<link
					rel={rel}
					href={src}
					as={as}
					crossOrigin={crossOrigin}
					integrity={integrity}
					referrerPolicy={referrerPolicy}
				/>
			)}
			<script
				id={id}
				src={src}
				defer={defer}
				async={async}
				type={type}
				noModule={noModule}
				nonce={nonce}
				crossOrigin={crossOrigin}
				integrity={integrity}
				referrerPolicy={referrerPolicy}
			/>
		</>
	);
}
