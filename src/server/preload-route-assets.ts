/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/preload-route-assets`.
 *
 * > [!CAUTION]
 * > This can potentialy create big `Link` header and can cause extremely hard to debug issues. Some provider's load balancers have set certain buffer for parsing outgoing response's headers and thanks to `preloadRouteAssets` you can easily reach that in a medium sized application.
 * > Your load balancer can randomly stop responding or start throwing 502 error.
 * > To overcome this either don't use `preloadRouteAssets`, set bigger buffer for processing response headers if you own the loadbalancer or use the `experimentalMinChunkSize` option in Vite config (this does not solve the issue permanently, only delays it)
 *
 * The `Link` header allows responses to push to the browser assets that are needed for the document, this is useful to improve the performance of the application by sending those assets earlier.
 *
 * Once Early Hints is supported this will also allows you to send the assets even before the document is ready, but for now you can benefit to send assets to preload before the browser parse the HTML.
 *
 * You can do this with the functions `preloadRouteAssets`, `preloadLinkedAssets` and `preloadModuleAssets`.
 *
 * All functions follows the same signature:
 *
 * ```ts
 * import {
 *   preloadRouteAssets,
 *   preloadLinkedAssets,
 *   preloadModuleAssets,
 * } from "remix-utils/preload-route-assets";
 *
 * // entry.server.tsx
 * export default function handleRequest(
 *   request: Request,
 *   statusCode: number,
 *   headers: Headers,
 *   context: EntryContext,
 * ) {
 *   let markup = renderToString(
 *     <RemixServer context={context} url={request.url} />,
 *   );
 *   headers.set("Content-Type", "text/html");
 *
 *   preloadRouteAssets(context, headers); // add this line
 *   // preloadLinkedAssets(context, headers);
 *   // preloadModuleAssets(context, headers);
 *
 *   return new Response("<!DOCTYPE html>" + markup, {
 *     status: statusCode,
 *     headers: headers,
 *   });
 * }
 * ```
 *
 * The `preloadRouteAssets` is a combination of both `preloadLinkedAssets` and `preloadModuleAssets` so you can use it to preload all assets for a route, if you use this one you don't need the other two
 *
 * The `preloadLinkedAssets` function will preload any link with `rel: "preload"` added with the Remix's `LinkFunction`, so you can configure assets to preload in your route and send them in the headers automatically. It will additionally preload any linked stylesheet file (with `rel: "stylesheet"`) even if not preloaded so it will load faster.
 *
 * The `preloadModuleAssets` function will preload all the JS files Remix adds to the page when hydrating it, Remix already renders a `<link rel="modulepreload">` for each now before the `<script type="module">` used to start the application, this will use Link headers to preload those assets.
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Server/Preload Route Assets
 */
import type { EntryContext } from "react-router";

type Link = { href: string; as: string };

/**
 * Combine `preloadLinkedAssets` and `preloadModuleAssets` into a single
 * function and preload both linked and module assets.
 * @param context Remix's EntryContext
 * @param headers The headers object to append the preload links to
 * @example
 * export default function handleRequest(
 *   request: Request,
 *   statusCode: number,
 *   headers: Headers,
 *   context: EntryContext
 * ) {
 *   let markup = renderToString(
 *     <RemixServer context={context} url={request.url} />
 *   );
 *   headers.set("Content-Type", "text/html");
 *
 *   preloadRouteAssets(context, headers); // add this line
 *
 *   return new Response("<!DOCTYPE html>" + markup, {
 *     status: statusCode,
 *     headers: headers,
 *   });
 * }
 */
export function preloadRouteAssets(context: EntryContext, headers: Headers) {
	preloadLinkedAssets(context, headers); // preload links
	preloadModuleAssets(context, headers); // preload JS modules
}

/**
 * Preload the assets linked in the routes matching the current request.
 * This function will preload any `<link rel="preload" />` tag added with
 * `LinksFunction` and any CSS files linked with `<link rel="stylesheet" />`.
 * @param context Remix's EntryContext
 * @param headers The headers object to append the preload links to
 * @example
 * export default function handleRequest(
 *   request: Request,
 *   statusCode: number,
 *   headers: Headers,
 *   context: EntryContext
 * ) {
 *   let markup = renderToString(
 *     <RemixServer context={context} url={request.url} />
 *   );
 *   headers.set("Content-Type", "text/html");
 *
 *   preloadLinkedAssets(context, headers); // add this line
 *
 *   return new Response("<!DOCTYPE html>" + markup, {
 *     status: statusCode,
 *     headers: headers,
 *   });
 * }
 */
export function preloadLinkedAssets(context: EntryContext, headers: Headers) {
	let links = context.staticHandlerContext.matches
		.flatMap((match) => {
			let route = context.routeModules[match.route.id];
			if (!route) return [];
			if (route.links instanceof Function) return route.links();
			return [];
		})
		.map((link) => {
			if ("as" in link && "href" in link) {
				return { href: link.href, as: link.as } as Link;
			}
			if ("rel" in link && "href" in link && link.rel === "stylesheet")
				return { href: link.href, as: "style" } as Link;
			return null;
		})
		.filter((link: Link | null): link is Link => {
			return link !== null && "href" in link;
		})
		.filter((item, index, list) => {
			return index === list.findIndex((link) => link.href === item.href);
		});

	for (let link of links) {
		headers.append("Link", `<${link.href}>; rel=preload; as=${link.as}`);
	}
}

/**
 * Add Link headers to preload the JS modules in the route matching the current
 * request.
 * @param context Remix's EntryContext
 * @param headers The headers object to append the preload links to
 * @example
 * export default function handleRequest(
 *   request: Request,
 *   statusCode: number,
 *   headers: Headers,
 *   context: EntryContext
 * ) {
 *   let markup = renderToString(
 *     <RemixServer context={context} url={request.url} />
 *   );
 *   headers.set("Content-Type", "text/html");
 *
 *   preloadModuleAssets(context, headers); // add this line
 *
 *   return new Response("<!DOCTYPE html>" + markup, {
 *     status: statusCode,
 *     headers: headers,
 *   });
 * }
 */
export function preloadModuleAssets(context: EntryContext, headers: Headers) {
	let urls: string[] = [
		context.manifest.url,
		context.manifest.entry.module,
		...context.manifest.entry.imports,
	];

	for (let match of context.staticHandlerContext.matches) {
		let route = context.manifest.routes[match.route.id];
		if (!route) {
			continue;
		}
		urls.push(route.module, ...(route.imports ?? []));
	}

	for (let url of urls) {
		headers.append("Link", `<${url}>; rel=preload; as=script; crossorigin=anonymous`);
	}
}
