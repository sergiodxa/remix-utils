import { EntryContext } from "@remix-run/server-runtime";

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
    urls.push(route.module, ...(route.imports ?? []));
  }

  for (let url of urls) {
    headers.append(
      "Link",
      `<${url}>; rel=preload; as=script; crossorigin=anonymous`
    );
  }
}
