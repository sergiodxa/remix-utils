import { createMemoryCacheStorage } from "../../src";

describe(createMemoryCacheStorage.name, () => {
	test("get returns null for missing key", async () => {
		let cache = createMemoryCacheStorage();
		await expect(cache.get("key")).resolves.toBeNull();
	});

	test("get returns the fallback for missing key", async () => {
		let cache = createMemoryCacheStorage();
		await expect(cache.get("key", "fallback")).resolves.toBe("fallback");
	});

	test("set saves a value", async () => {
		let cache = createMemoryCacheStorage();
		await expect(cache.set("key", "value")).resolves.toBeUndefined();
		await expect(cache.get("key")).resolves.toBe("value");
	});

	test("set saves a value with a ttl", async () => {
		let cache = createMemoryCacheStorage();
		await expect(cache.set("key", "value", 10)).resolves.toBeUndefined();
		await expect(cache.get("key")).resolves.toBe("value");
		await new Promise((resolve) => setTimeout(resolve, 11));
		await expect(cache.get("key")).resolves.toBeNull();
	});

	test("delete removes a value", async () => {
		let cache = createMemoryCacheStorage();
		await expect(cache.set("key", "value")).resolves.toBeUndefined();
		await expect(cache.get("key")).resolves.toBe("value");
		await expect(cache.delete("key")).resolves.toBeUndefined();
		await expect(cache.get("key")).resolves.toBeNull();
	});

	test("has returns false for missing key", async () => {
		let cache = createMemoryCacheStorage();
		await expect(cache.has("key")).resolves.toBe(false);
	});

	test("has returns false for expired key", async () => {
		let cache = createMemoryCacheStorage();
		await expect(cache.set("key", "value", 10)).resolves.toBeUndefined();
		await new Promise((resolve) => setTimeout(resolve, 11));
		await expect(cache.has("key")).resolves.toBe(false);
	});

	test("has returns true for existing key", async () => {
		let cache = createMemoryCacheStorage();
		await expect(cache.set("key", "value")).resolves.toBeUndefined();
		await expect(cache.has("key")).resolves.toBe(true);
	});

	test("clear removes all values", async () => {
		let cache = createMemoryCacheStorage();
		await expect(cache.set("key-1", "value")).resolves.toBeUndefined();
		await expect(cache.set("key-2", "value")).resolves.toBeUndefined();
		await expect(cache.clear()).resolves.toBeUndefined();
		await expect(cache.has("key-1")).resolves.toBe(false);
		await expect(cache.has("key-2")).resolves.toBe(false);
	});
});
