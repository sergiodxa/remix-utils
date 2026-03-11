/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/cache-assets`.
 *
 * > [!NOTE]
 * > This can only be run inside `entry.client`.
 *
 * This function lets you easily cache inside the [browser's Cache Storage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage) every JS file built by Remix.
 *
 * To use it, open your `entry.client` file and add this:
 *
 * ```ts
 * import { cacheAssets } from "remix-utils/cache-assets";
 *
 * cacheAssets().catch((error) => {
 * 	// do something with the error, or not
 * });
 * ```
 *
 * The function receives an optional options object with two options:
 *
 * - `cacheName` is the name of the [Cache object](https://developer.mozilla.org/en-US/docs/Web/API/Cache) to use, the default value is `assets`.
 * - `buildPath` is the pathname prefix for all Remix built assets, the default value is `/build/` which is the default build path of Remix itself.
 *
 * It's important that if you changed your build path in `remix.config.js` you pass the same value to `cacheAssets` or it will not find your JS files.
 *
 * The `cacheName` can be left as is unless you're adding a Service Worker to your app and want to share the cache.
 *
 * ```ts
 * import { cacheAssets } from "remix-utils/cache-assets";
 *
 * cacheAssests({ cacheName: "assets", buildPath: "/build/" }).catch((error) => {
 * 	// do something with the error, or not
 * });
 * ```
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Client/Cache Assets
 */
export interface CacheAssetsOptions {
	/**
	 * The name of the cache to use inside the browser Cache Storage
	 * @default "assets"
	 */
	cacheName?: string;
	/**
	 * The path prefix for all build assets, if you used a subdomain ensure this
	 * is only the pathname part.
	 * @default "/build/"
	 */
	buildPath?: string;
}

/**
 * Caches all JS files built by Remix in a browser cache.
 * This will use the Remix manifest to determine which files to cache.
 * It will get every JS file, get all the already cached URLs, remove any
 * old file, and finally add the new files to the cache.
 *
 * **This can only be run inside entry.client**
 */
export async function cacheAssets({
	cacheName = "assets",
	buildPath = "/build/",
}: CacheAssetsOptions = {}) {
	let paths = getFilePaths();
	let cache = await caches.open(cacheName);
	let urls = await getCachedUrls(cache, buildPath);
	await removeOldAssets(cache, paths, urls);
	await addNewAssets(cache, paths, urls);
}

function getFilePaths() {
	try {
		return unique([
			// biome-ignore lint/suspicious/noExplicitAny: global window type is missing proper typing
			...Object.values((window as any).__reactRouterManifest.routes).flatMap(
				// biome-ignore lint/suspicious/noExplicitAny: global window type is missing proper typing
				(route: any) => {
					return [route.module, ...(route.imports ?? [])];
				},
			),
			// biome-ignore lint/suspicious/noExplicitAny: global window type is missing proper typing
			(window as any).__reactRouterManifest.url,
			// biome-ignore lint/suspicious/noExplicitAny: global window type is missing proper typing
			(window as any).__reactRouterManifest.entry.module,
			// biome-ignore lint/suspicious/noExplicitAny: global window type is missing proper typing
			...(window as any).__reactRouterManifest.entry.imports,
		]);
	} catch {
		throw new Error("Failed to get file paths from Remix manifest");
	}
}

async function getCachedUrls(cache: Cache, buildPath: CacheAssetsOptions["buildPath"] = "/build/") {
	try {
		let keys = await cache.keys();
		return keys
			.map((key) => {
				return new URL(key.url);
			})
			.filter((url) => url.hostname === window.location.hostname)
			.map((url) => url.pathname)
			.filter((pathname) => pathname.startsWith(buildPath));
	} catch {
		throw new Error("Failed to retrieve cached URLs");
	}
}

async function removeOldAssets(cache: Cache, paths: string[], urls: string[]) {
	try {
		await Promise.all(
			urls
				.filter((pathname) => !paths.includes(pathname))
				.map((pathname) => cache.delete(pathname)),
		);
	} catch {
		throw new Error("Failed to remove old assets from the cache");
	}
}

async function addNewAssets(cache: Cache, paths: string[], urls: string[]) {
	try {
		await cache.addAll(paths.filter((path) => !urls.includes(path)));
	} catch {
		throw new Error("Failed to add new assets to the cache");
	}
}

function unique<Value>(array: Value[]): Value[] {
	return [...new Set(array)];
}
