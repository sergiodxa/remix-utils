export interface Cache {
	get(key: string, fallback?: unknown): Promise<unknown | null>;
	set(key: string, value: unknown, ttl?: number): Promise<void>;
	delete(key: string): Promise<void>;
	has(key: string): Promise<boolean>;
	clear(): Promise<void>;
}

export function createCacheStorage(implementation: Cache) {
	return implementation;
}

export function createMemoryCacheStorage() {
	let cache = new Map<string, { ttl?: number; data: unknown }>();

	return {
		async get(key: string, fallback: unknown = null) {
			const item = cache.get(key);
			if (!item) return fallback;
			if (item.ttl && item.ttl < Date.now()) {
				cache.delete(key);
				return fallback;
			}
			return item.data;
		},

		async set(key: string, value: unknown, ttl?: number) {
			cache.set(key, { ttl: ttl ? Date.now() + ttl : undefined, data: value });
		},

		async delete(key: string) {
			cache.delete(key);
		},

		async has(key: string) {
			if (!cache.has(key)) return false;
			const item = cache.get(key);
			if (item && item.ttl && item.ttl < Date.now()) {
				cache.delete(key);
				return false;
			}
			return true;
		},

		async clear() {
			cache.clear();
		},
	};
}
