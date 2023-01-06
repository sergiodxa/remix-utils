import { preloadRouteAssets } from "../../src";

describe(preloadRouteAssets.name, () => {
  let context: EntryContext = {
    manifest: {
      url: "/manifest.js",
      routes: {},
      version: "latest",
      entry: {
        imports: ["/chunk-1.js", "/chunk-2.js"],
        module: "/entry.client.js",
      },
    },
    matches: [
      {
        params: {},
        pathname: "/",
        route: {
          hasAction: false,
          hasCatchBoundary: false,
          hasErrorBoundary: false,
          hasLoader: false,
          id: "root",
          imports: ["/chunk-3.js", "/chunk-4.js"],
          module: "/routes/root.js",
        },
      },
      {
        params: {},
        pathname: "/",
        route: {
          hasAction: false,
          hasCatchBoundary: false,
          hasErrorBoundary: false,
          hasLoader: false,
          id: "routes/index",
          imports: ["/chunk-5.js"],
          module: "/routes/index.js",
        },
      },
    ],
    routeData: {},
    routeModules: {
      root: {
        default() {
          return null;
        },
        links() {
          return [{ rel: "stylesheet", href: "/styles.css" }];
        },
      },
      "routes/index": {
        default() {
          return null;
        },
        links: undefined,
      },
    },
    appState: {
      catchBoundaryRouteId: "catchBoundary",
      loaderBoundaryRouteId: "loaderBoundary",
      renderBoundaryRouteId: "renderBoundary",
      trackBoundaries: false,
      trackCatchBoundaries: false,
    },
    future: { v2_meta: false },
  };

  test("should add the Link headers", () => {
    let headers = new Headers();

    preloadRouteAssets(context, headers);

    expect(headers.get("link")).toMatchInlineSnapshot(
      `"</styles.css>; rel=preload; as=style, </manifest.js>; rel=preload; as=script; crossorigin=anonymous, </entry.client.js>; rel=preload; as=script; crossorigin=anonymous, </chunk-1.js>; rel=preload; as=script; crossorigin=anonymous, </chunk-2.js>; rel=preload; as=script; crossorigin=anonymous, </routes/root.js>; rel=preload; as=script; crossorigin=anonymous, </chunk-3.js>; rel=preload; as=script; crossorigin=anonymous, </chunk-4.js>; rel=preload; as=script; crossorigin=anonymous, </routes/index.js>; rel=preload; as=script; crossorigin=anonymous, </chunk-5.js>; rel=preload; as=script; crossorigin=anonymous"`
    );
  });

  test("should respect manually added Link headers", () => {
    let headers = new Headers();
    headers.set("Link", "</custom.js>; rel=preload; as=script");
    preloadRouteAssets(context, headers);
    expect(headers.get("link")).toMatchInlineSnapshot(
      `"</custom.js>; rel=preload; as=script, </styles.css>; rel=preload; as=style, </manifest.js>; rel=preload; as=script; crossorigin=anonymous, </entry.client.js>; rel=preload; as=script; crossorigin=anonymous, </chunk-1.js>; rel=preload; as=script; crossorigin=anonymous, </chunk-2.js>; rel=preload; as=script; crossorigin=anonymous, </routes/root.js>; rel=preload; as=script; crossorigin=anonymous, </chunk-3.js>; rel=preload; as=script; crossorigin=anonymous, </chunk-4.js>; rel=preload; as=script; crossorigin=anonymous, </routes/index.js>; rel=preload; as=script; crossorigin=anonymous, </chunk-5.js>; rel=preload; as=script; crossorigin=anonymous"`
    );
  });
});
