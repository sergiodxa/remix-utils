import { useLocation, useMatches } from "@remix-run/react";
import * as React from "react";
import { HandleConventionArguments } from "./handle-conventions.js";
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
export function ExternalScripts() {
	let scripts = useExternalScripts();

	return (
		<>
			{scripts.map((props) => {
				return <ExternalScript key={props.src} {...props} />;
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

			let scripts = match.handle.scripts as
				| ExternalScriptsFunction
				| ScriptDescriptor[];

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
		};

		for (let [key, value] of Object.entries(attributes)) {
			if (value) $script.setAttribute(key, value.toString());
		}

		document.body.append($script);

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
