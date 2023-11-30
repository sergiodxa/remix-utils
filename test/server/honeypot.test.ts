import { describe, expect, test } from "vitest";
import { Crypto } from "@peculiar/webcrypto";
import { fromUint8Array } from "js-base64";
import { Honeypot, SpamError } from "../../src/server/honeypot";

function invariant(condition: any, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

async function encryptForTest(
	value,
	encryptionSeed,
	webCrypto: Crypto = globalThis.crypto,
) {
	let textEncoder = new globalThis.TextEncoder();

	// Convert the seed to a raw key
	let rawKey = textEncoder.encode(encryptionSeed);
	let masterKey = await webCrypto.subtle.importKey(
		"raw",
		rawKey,
		{ name: "HKDF", hash: "SHA-256" },
		false,
		["deriveKey"],
	);

	// Derive a key for encryption
	let salt = webCrypto.getRandomValues(new Uint8Array(16));
	let derivedKey = await webCrypto.subtle.deriveKey(
		{
			name: "HKDF",
			hash: "SHA-256",
			salt: salt,
			info: new ArrayBuffer(0),
		},
		masterKey,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt"],
	);

	// Encrypt the value
	let iv = webCrypto.getRandomValues(new Uint8Array(12));
	let encoded = textEncoder.encode(value);
	let encrypted = await webCrypto.subtle.encrypt(
		{ name: "AES-GCM", iv: iv },
		derivedKey,
		encoded,
	);

	// Combine salt, iv, and encrypted data
	let saltIvAndEncrypted = new Uint8Array(
		salt.byteLength + iv.byteLength + encrypted.byteLength,
	);
	saltIvAndEncrypted.set(new Uint8Array(salt), 0);
	saltIvAndEncrypted.set(new Uint8Array(iv), salt.byteLength);
	saltIvAndEncrypted.set(
		new Uint8Array(encrypted),
		salt.byteLength + iv.byteLength,
	);

	// Convert to base64
	return fromUint8Array(saltIvAndEncrypted, true);
}

describe(Honeypot.name, async () => {
	test("generates input props", async () => {
		let props = await new Honeypot().getInputProps();
		expect(props).toEqual({
			nameFieldName: "name__confirm",
			validFromFieldName: "from__confirm",
			encryptedValidFrom: expect.any(String),
		});
	});

	test("uses randomized nameFieldName", async () => {
		let honeypot = new Honeypot({ randomizeNameFieldName: true });
		let props = await honeypot.getInputProps();
		expect(props.nameFieldName.startsWith("name__confirm_")).toBeTruthy();
	});

	test("uses randomized nameFieldName with prefix", async () => {
		let honeypot = new Honeypot({
			randomizeNameFieldName: true,
			nameFieldName: "prefix",
		});
		let props = await honeypot.getInputProps();
		expect(props.nameFieldName.startsWith("prefix_")).toBeTruthy();
	});

	test("checks validity on FormData", async () => {
		let formData = new FormData();
		let result = await new Honeypot().check(formData);
		expect(result).toBeUndefined();
	});

	test("checks validity of FormData with encrypted timestamp and randomized field name", async () => {
		let honeypot = new Honeypot({ randomizeNameFieldName: true });

		let props = await honeypot.getInputProps();
		invariant(props.validFromFieldName, "validFromFieldName is null");

		let formData = new FormData();
		formData.set(props.nameFieldName, "");
		formData.set(props.validFromFieldName, props.encryptedValidFrom);

		expect(await honeypot.check(formData)).toBeUndefined();
	});

	test("fails validity check if input is not present", async () => {
		let honeypot = new Honeypot();
		let props = await honeypot.getInputProps();
		invariant(props.validFromFieldName, "validFromFieldName is null");

		let formData = new FormData();
		formData.set(props.validFromFieldName, props.encryptedValidFrom);

		expect(async () => await honeypot.check(formData)).rejects.toThrow(
			new SpamError("Missing honeypot input"),
		);
	});

	test("fails validity check if input is not empty", async () => {
		let honeypot = new Honeypot();
		let props = await honeypot.getInputProps();

		let formData = new FormData();
		formData.set(props.nameFieldName, "not empty");

		expect(async () => await honeypot.check(formData)).rejects.toThrow(
			new SpamError("Honeypot input not empty"),
		);
	});

	test("fails if valid from timestamp is missing", async () => {
		let honeypot = new Honeypot();
		let props = await honeypot.getInputProps();

		let formData = new FormData();
		formData.set(props.nameFieldName, "");

		expect(async () => await honeypot.check(formData)).rejects.toThrow(
			new SpamError("Missing honeypot valid from input"),
		);
	});

	test("fails if the timestamp is not valid", async () => {
		let honeypot = new Honeypot({
			encryptionSeed: "SEED",
		});
		let props = await honeypot.getInputProps();
		invariant(props.validFromFieldName, "validFromFieldName is null");

		let formData = new FormData();
		formData.set(props.nameFieldName, "");
		formData.set(
			props.validFromFieldName,
			await encryptForTest("invalid", "SEED"),
		);

		expect(async () => await honeypot.check(formData)).rejects.toThrow(
			new SpamError("Invalid honeypot valid from input"),
		);
	});

	test("fails if valid from timestamp is in the future", async () => {
		let honeypot = new Honeypot({
			encryptionSeed: "SEED",
		});

		let props = await honeypot.getInputProps();
		invariant(props.validFromFieldName, "validFromFieldName is null");

		let formData = new FormData();
		formData.set(props.nameFieldName, "");
		formData.set(
			props.validFromFieldName,
			await encryptForTest((Date.now() + 10_000).toString(), "SEED"),
		);

		expect(async () => await honeypot.check(formData)).rejects.toThrow(
			new SpamError("Honeypot valid from is in future"),
		);
	});

	test("fails if valid from timestamp is in the future with WebCrypto polyfill", async () => {
		let honeypot = new Honeypot({
			encryptionSeed: "SEED",
			webCrypto: new Crypto(),
		});

		let props = await honeypot.getInputProps();
		invariant(props.validFromFieldName, "validFromFieldName is null");

		let formData = new FormData();
		formData.set(props.nameFieldName, "");
		formData.set(
			props.validFromFieldName,
			await encryptForTest(
				(Date.now() + 10_000).toString(),
				"SEED",
				new Crypto(),
			),
		);

		expect(async () => await honeypot.check(formData)).rejects.toThrow(
			new SpamError("Honeypot valid from is in future"),
		);
	});

	test("does not check for valid from timestamp if it's set to null", async () => {
		let honeypot = new Honeypot({
			validFromFieldName: null,
		});

		let props = await honeypot.getInputProps();
		expect(props.validFromFieldName).toBeNull();

		let formData = new FormData();
		formData.set(props.nameFieldName, "");

		expect(async () => await honeypot.check(formData)).not.toThrow();
	});
});
