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

/**
 * For GlobalAttributesDescriptor Type - Ideally we'd use React's
 * HTMLAttributes<HTMLScriptElement> directly or even a Pick<> around that type
 * but there are quite a few global attributes and the React type includes
 * eventHandlers and other attributes we don't want to include. We've
 * explicitly called out the possible expected Global attributes here for
 * clarity.
 */
type GlobalAttributesDescriptor = {
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/accesskey
	 */
	accessKey?: React.HTMLAttributes<HTMLScriptElement>["accessKey"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/anchor
	 */
	anchor?: string; // doesn't exist in React types yet
	/**
	 * Experimental
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocapitalize
	 */
	autoCapitalize?: React.HTMLAttributes<HTMLScriptElement>["autoCapitalize"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocorrect
	 */
	autoCorrect?: React.HTMLAttributes<HTMLScriptElement>["autoCorrect"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autofocus
	 */
	autoFocus?: React.HTMLAttributes<HTMLScriptElement>["autoFocus"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/class
	 */
	class?: string;
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable
	 */
	contentEditable?: React.HTMLAttributes<HTMLScriptElement>["contentEditable"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/data-*
	 */
	[key: `data-${string}`]: string | undefined;
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/dir
	 */
	dir?: "rtl" | "ltr" | "auto"; // better than React.HTMLAttributes<HTMLScriptElement>['dir'] which is just string.
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/draggable
	 */
	draggable?: React.HTMLAttributes<HTMLScriptElement>["draggable"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint
	 */
	enterKeyHint?: React.HTMLAttributes<HTMLScriptElement>["enterKeyHint"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/exportparts
	 */
	exportParts?: string;
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden
	 */
	hidden?: React.HTMLAttributes<HTMLScriptElement>["hidden"];
	/**
	 * Optional element ID. Use only if the script element needs to be explicitly referenced later.
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/id
	 */
	id?: React.HTMLAttributes<HTMLScriptElement>["id"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert
	 */
	inert?: React.HTMLAttributes<HTMLScriptElement>["inert"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode
	 */
	inputMode?: React.HTMLAttributes<HTMLScriptElement>["inputMode"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/is
	 */
	is?: React.HTMLAttributes<HTMLScriptElement>["is"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/itemid
	 */
	itemID?: React.HTMLAttributes<HTMLScriptElement>["itemID"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/itemprop
	 */
	itemProp?: React.HTMLAttributes<HTMLScriptElement>["itemProp"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/itemref
	 */
	itemRef?: React.HTMLAttributes<HTMLScriptElement>["itemRef"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/itemscope
	 */
	itemScope?: React.HTMLAttributes<HTMLScriptElement>["itemScope"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/itemtype
	 */
	itemType?: React.HTMLAttributes<HTMLScriptElement>["itemType"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang
	 */
	lang?: React.HTMLAttributes<HTMLScriptElement>["lang"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce
	 */
	nonce?: React.HTMLAttributes<HTMLScriptElement>["nonce"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/part
	 */
	part?: React.HTMLAttributes<HTMLScriptElement>["part"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover
	 */
	popover?: React.HTMLAttributes<HTMLScriptElement>["popover"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/role
	 */
	role?: React.HTMLAttributes<HTMLScriptElement>["role"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/slot
	 */
	slot?: React.HTMLAttributes<HTMLScriptElement>["slot"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/spellcheck
	 */
	spellCheck?: React.HTMLAttributes<HTMLScriptElement>["spellCheck"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/style
	 */
	style?: React.HTMLAttributes<HTMLScriptElement>["style"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex
	 */
	tabIndex?: React.HTMLAttributes<HTMLScriptElement>["tabIndex"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/title
	 */
	title?: React.HTMLAttributes<HTMLScriptElement>["title"];
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/translate
	 */
	translate?: React.HTMLAttributes<HTMLScriptElement>["translate"];
	/**
	 * Limited Availability
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/virtualkeyboardpolicy
	 */
	virtualkeyboardpolicy?: "auto" | "manual" | ""; // doesn't exist in React types yet.
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/writingmode
	 */
	writingsuggestions?: boolean | null; // doesn't exist in React types yet.
};

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
} & GlobalAttributesDescriptor;

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
	...global
}: ScriptDescriptor) {
	let isHydrated = useHydrated();
	let startsHydrated = React.useRef(isHydrated);

	// biome-ignore lint/correctness/useExhaustiveDependencies: for small objects using JSON.stringify shouldn't impact performance. We also can't explicitly declare each possible global attribute especially data-* attributes.
	const memoizedGlobal = React.useMemo(
		() => ({
			...global,
		}),
		[JSON.stringify(global)],
	);

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
			...memoizedGlobal,
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
		memoizedGlobal,
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
				{...memoizedGlobal}
			/>
		</>
	);
}
