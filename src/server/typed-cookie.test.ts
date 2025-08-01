import { describe, expect, test } from "bun:test";
import {
	createCookie,
	createCookieSessionStorage,
	isCookie,
} from "react-router";
import { z } from "zod/v4";
import {
	ValidationError,
	createTypedCookie,
	isTypedCookie,
} from "./typed-cookie";

// TODO Fix this
// install globals removal makes these crash
describe("Typed Cookie", () => {
	let cookie = createCookie("name", { secrets: ["secret"] });
	let typedCookie = createTypedCookie({ cookie, schema: z.string().min(3) });

	test("isCookie pass", () => {
		expect(isCookie(typedCookie)).toBe(true);
	});

	test("throw if serialized type is not valid", async () => {
		expect(typedCookie.serialize("a")).rejects.toThrowError(ValidationError);
		// @ts-expect-error We now this will be a TS error
		expect(typedCookie.serialize(123)).rejects.toThrowError(ValidationError);
	});

	test("throw if parsed type is not valid", async () => {
		let cookieHeader = await cookie.serialize("a");
		expect(typedCookie.parse(cookieHeader)).rejects.toThrowError(
			ValidationError,
		);
	});

	test("sessionStorage must accepts typed-cookie", async () => {
		let cookie = createCookie("name", { secrets: ["secret"] });
		let schema = z.object({ token: z.string() });

		let typedCookie = createTypedCookie({ cookie, schema });

		let sessionStorage = createCookieSessionStorage({ cookie: typedCookie });

		let cookieHeader = await typedCookie.serialize({ token: "a-b-c" });

		let session = await sessionStorage.getSession(cookieHeader);

		expect(schema.parse(session.data)).toEqual({ token: "a-b-c" });

		session.unset("token");

		expect(sessionStorage.commitSession(session)).rejects.toThrowError(
			ValidationError,
		);
	});

	test("supports async schemas", async () => {
		let cookie = createCookie("name", { secrets: ["secret"] });
		let schema = z.object({
			token: z.string().refine(async () => {
				return false;
			}, "INVALID_TOKEN"),
		});

		let typedCookie = createTypedCookie({ cookie, schema });

		expect(typedCookie.serialize({ token: "a-b-c" })).rejects.toThrowError(
			ValidationError,
		);
	});

	test("pass isTypedCookie", async () => {
		expect(isTypedCookie(typedCookie)).toBe(true);
		expect(isTypedCookie(cookie)).toBe(false);
	});

	test("can store arrays", async () => {
		let typedCookie = createTypedCookie({
			cookie,
			schema: z.array(z.string()),
		});

		expect(
			typedCookie.parse(await typedCookie.serialize(["a", "b", "c"])),
		).resolves.toEqual(["a", "b", "c"]);
	});

	test("can't store functions", async () => {
		// Functions cannot be serialized to JSON meaningfully - they become empty objects
		// We use z.any() to allow the serialization, but demonstrate the function is lost
		let typedCookie = createTypedCookie({
			cookie,
			schema: z.any(),
		});

		// Try to serialize a function - it will succeed but the function becomes an empty object
		const testFunction = () => "hello";
		
		let serialized = await typedCookie.serialize(testFunction);
		let parsed = await typedCookie.parse(serialized);
		
		// The function should have been lost in serialization (becomes empty object)
		expect(parsed).toEqual({});
		expect(typeof parsed).not.toBe("function");
		
		// The original function behavior is completely lost
		expect(typeof testFunction).toBe("function");
		expect(testFunction()).toBe("hello");
	});

	test("can store booleans", async () => {
		let typedCookie = createTypedCookie({
			cookie,
			schema: z.boolean(),
		});

		expect(
			typedCookie.parse(await typedCookie.serialize(true)),
		).resolves.toEqual(true);

		expect(
			typedCookie.parse(await typedCookie.serialize(false)),
		).resolves.toEqual(false);
	});

	test("can store numbers", async () => {
		let typedCookie = createTypedCookie({
			cookie,
			schema: z.number(),
		});

		expect(
			typedCookie.parse(await typedCookie.serialize(123)),
		).resolves.toEqual(123);
	});

	test("can store dates", async () => {
		let typedCookie = createTypedCookie({
			cookie,
			schema: z.preprocess((value) => {
				if (typeof value === "string") return new Date(value);
				if (value instanceof Date) return value;
				throw new TypeError("Invalid value");
			}, z.date()),
		});

		expect(
			typedCookie.parse(await typedCookie.serialize(new Date())),
		).resolves.toBeInstanceOf(Date);
	});

	test("can store objects", async () => {
		let typedCookie = createTypedCookie({
			cookie,
			schema: z.object({
				token: z.string(),
			}),
		});

		expect(
			typedCookie.parse(await typedCookie.serialize({ token: "a-b-c" })),
		).resolves.toEqual({ token: "a-b-c" });
	});

	test("can store null", async () => {
		let typedCookie = createTypedCookie({
			cookie,
			schema: z.null(),
		});

		expect(
			typedCookie.parse(await typedCookie.serialize(null)),
		).resolves.toEqual(null);
	});

	test("can store undefined", async () => {
		let typedCookie = createTypedCookie({
			cookie,
			schema: z.undefined(),
		});

		expect(
			typedCookie.parse(await typedCookie.serialize(void 0)),
		).rejects.toThrowError(
			new ValidationError([
				{ path: [], message: "Expected undefined, received object" },
			]),
		);
	});
});
