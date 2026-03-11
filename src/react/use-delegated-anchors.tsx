/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/use-delegated-anchors`.
 *
 * When using Remix, you can use the `<Link>` component to navigate between pages. However, if you have a `<a href>` that links to a page in your app, it will cause a full page refresh. This can be what you want, but sometimes you want to use client-side navigation here instead.
 *
 * The `useDelegatedAnchors` hook lets you add client-side navigation to anchor tags in a portion of your app. This can be specially useful when working with dynamic content like HTML or Markdown from a CMS.
 *
 * ```tsx
 * import { useDelegatedAnchors } from "remix-utils/use-delegated-anchors";
 *
 * export async function loader() {
 * 	let content = await fetchContentFromCMS();
 * 	return json({ content });
 * }
 *
 * export default function Component() {
 * 	let { content } = useLoaderData<typeof loader>();
 *
 * 	let ref = useRef<HTMLDivElement>(null);
 * 	useDelegatedAnchors(ref);
 *
 * 	return <article ref={ref} dangerouslySetInnerHTML={{ __html: content }} />;
 * }
 * ```
 *
 * ---
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/use-delegated-anchors`.
 *
 * If additionally you want to be able to prefetch your anchors you can use the `PrefetchPageAnchors` components.
 *
 * This components wraps your content with anchors inside, it detects any hovered anchor to prefetch it, and it delegates them to Remix.
 *
 * ```tsx
 * import { PrefetchPageAnchors } from "remix-utils/use-delegated-anchors";
 *
 * export async function loader() {
 * 	let content = await fetchContentFromCMS();
 * 	return json({ content });
 * }
 *
 * export default function Component() {
 * 	let { content } = useLoaderData<typeof loader>();
 *
 * 	return (
 * 		<PrefetchPageAnchors>
 * 			<article ref={ref} dangerouslySetInnerHTML={{ __html: content }} />
 * 		</PrefetchPageAnchors>
 * 	);
 * }
 * ```
 *
 * Now you can see in your DevTools that when the user hovers an anchor it will prefetch it, and when the user clicks it will do a client-side navigation.
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Hook/Use Delegated Anchors
 */
import * as React from "react";
import { PrefetchPageLinks, useNavigate } from "react-router";

const context = React.createContext(false);

export function isLinkEvent(event: MouseEvent) {
	if (!(event.target instanceof HTMLElement)) return;
	let a = event.target.closest("a");
	if (a?.hasAttribute("href") && a.host === window.location.host) return a;
	return;
}

export function useDelegatedAnchors(nodeRef: React.RefObject<HTMLElement | null>) {
	let navigate = useNavigate();
	let hasParentPrefetch = React.useContext(context);

	React.useEffect(() => {
		// if you call useDelegatedAnchors as a children of a PrefetchPageAnchors
		// then do nothing
		if (hasParentPrefetch) return;

		let node = nodeRef.current;

		node?.addEventListener("click", handleClick);
		return () => node?.removeEventListener("click", handleClick);

		function handleClick(event: MouseEvent) {
			if (!node) return;

			let anchor = isLinkEvent(event);

			if (!anchor) return;
			if (event.button !== 0) return;
			if (anchor.target && anchor.target !== "_self") return;
			if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
				return;
			}

			if (anchor.hasAttribute("download")) return;

			let { pathname, search, hash } = anchor;
			navigate({ pathname, search, hash });

			event.preventDefault();
		}
	}, [hasParentPrefetch, navigate, nodeRef]);
}

export function PrefetchPageAnchors({ children }: { children: React.ReactNode }) {
	let nodeRef = React.useRef<HTMLDivElement>(null);
	let [page, setPage] = React.useState<null | string>(null);
	let hasParentPrefetch = React.useContext(context);

	// prefetch is useless without delegated anchors, so we enable it
	useDelegatedAnchors(nodeRef);

	React.useEffect(() => {
		if (hasParentPrefetch) return;

		let node = nodeRef.current;

		node?.addEventListener("mouseenter", handleMouseEnter, true);
		return () => node?.removeEventListener("mouseenter", handleMouseEnter);

		function handleMouseEnter(event: MouseEvent) {
			if (!nodeRef.current) return;
			let anchor = isLinkEvent(event);
			if (!anchor) return;

			let { pathname, search } = anchor;
			setPage(pathname + search);
		}
	}, [hasParentPrefetch]);

	return (
		<div ref={nodeRef} style={{ display: "contents" }}>
			<context.Provider value={true}>{children}</context.Provider>
			{page && !hasParentPrefetch && <PrefetchPageLinks page={page} />}
		</div>
	);
}
