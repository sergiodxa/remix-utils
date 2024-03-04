import { useFetcher } from "@remix-run/react";
import { useEffect } from "react";
import { useHydrated } from "./use-hydrated.js";

interface AppIsStaleOptions {
	/**
	 * The path of the endpoint used to check the server version.
	 * @default "/api/version"
	 */
	path?: string;
	/**
	 * The interval in milliseconds to check the server version.
	 * @default 5000
	 */
	intervalMs?: number;
}

/**
 * Checks if the app is stale by comparing the server version with the client
 * version.
 * @param options The options for the hook.
 * @returns `true` if the app is stale, `false` otherwise.
 * @example
 * let isStale = useAppIsStale();
 * useEffect(() => {
 *   if (!isStale) return;
 *   if (window.confirm("The app is stale. Reload?")) {
 *     window.location.reload();
 *   }
 * }, [isStale]);
 */
export function useAppIsStale({
	path = "/api/version",
	intervalMs = 5000,
}: AppIsStaleOptions = {}) {
	let isHydrated = useHydrated();
	let { load, data } = useFetcher<{ version: string }>();

	let isStale = false;

	if (isHydrated && data) {
		isStale = data.version !== window.__remixManifest?.version;
	}

	useEffect(() => {
		if (isStale) return;
		let id = setInterval(() => load(path), intervalMs);
		return () => clearInterval(id);
	}, [load, path, intervalMs, isStale]);

	return isStale;
}
