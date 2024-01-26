import { useCallback, useEffect, useState } from "react";

interface AppIsStaleOptions {
	path?: string;
	intervalMs?: number;
}

export function useAppIsStale({
	path = "/api/version",
	intervalMs = 2000,
}: AppIsStaleOptions = {}) {
	let [isStale, setIsState] = useState(false);

	let callback = useCallback(async () => {
		if (isStale) return;
		try {
			let response = await fetch(path, {
				credentials: "omit",
				redirect: "error",
				cache: "no-cache",
			});
			if (!response.ok) return;

			let data = await response.json();

			if (typeof data !== "object") return;
			if (data === null) return;
			if (!("version" in data)) return;
			if (typeof data.version !== "string") return;

			return setIsState(data.version !== window.__remixManifest.version);
		} catch {
			return;
		}
	}, [isStale, path]);

	usePoll(callback, intervalMs);

	return isStale;
}

function usePoll(callback: () => void, intervalMs: number) {
	useEffect(() => {
		let id = setInterval(callback, intervalMs);
		return () => clearInterval(id);
	}, [callback, intervalMs]);
}
