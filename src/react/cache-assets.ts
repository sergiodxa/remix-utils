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
      ...Object.values(self.__remixManifest.routes).flatMap((route) => {
        return [route.module, ...(route.imports ?? [])];
      }),
      self.__remixManifest.url,
      self.__remixManifest.entry.module,
      ...self.__remixManifest.entry.imports,
    ]);
  } catch {
    throw new Error("Failed to get file paths from Remix manifest");
  }
}

async function getCachedUrls(
  cache: Cache,
  buildPath: CacheAssetsOptions["buildPath"] = "/build/"
) {
  try {
    let keys = await cache.keys();
    return keys
      .map((key) => {
        return new URL(key.url);
      })
      .filter((url) => url.hostname === self.location.hostname)
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
        .map((pathname) => cache.delete(pathname))
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
