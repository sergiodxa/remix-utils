import { describe, expect, test } from "bun:test";

import { encrypt } from "../common/crypto";
import { Honeypot, SpamError } from "./honeypot";

// biome-ignore lint/suspicious/noExplicitAny: Test
function invariant(condition: any, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

describe(Honeypot.name, () => {
	test("generates input props", () => {
		let props = new Honeypot().getInputProps();
		expect(props).resolves.toEqual({
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

	test("checks validity on FormData", () => {
		let formData = new FormData();
		expect(new Honeypot().check(formData)).resolves.toBeUndefined();
	});

	test("checks validity of FormData with encrypted timestamp and randomized field name", async () => {
		let honeypot = new Honeypot({ randomizeNameFieldName: true });

		let props = await honeypot.getInputProps();
		invariant(props.validFromFieldName, "validFromFieldName is null");

		let formData = new FormData();
		formData.set(props.nameFieldName, "");
		formData.set(props.validFromFieldName, props.encryptedValidFrom);

		expect(honeypot.check(formData)).resolves.toBeUndefined();
	});

	test("fails validity check if input is not present", async () => {
		let honeypot = new Honeypot();
		let props = await honeypot.getInputProps();
		invariant(props.validFromFieldName, "validFromFieldName is null");

		let formData = new FormData();
		formData.set(props.validFromFieldName, props.encryptedValidFrom);

		expect(() => honeypot.check(formData)).toThrowError(
			new SpamError("Missing honeypot input"),
		);
	});

	test("fails validity check if input is not empty", async () => {
		let honeypot = new Honeypot();
		let props = await honeypot.getInputProps();

		let formData = new FormData();
		formData.set(props.nameFieldName, "not empty");

		expect(() => honeypot.check(formData)).toThrowError(
			new SpamError("Honeypot input not empty"),
		);
	});

	test("fails if valid from timestamp is missing", async () => {
		let honeypot = new Honeypot();
		let props = await honeypot.getInputProps();

		let formData = new FormData();
		formData.set(props.nameFieldName, "");

		expect(() => honeypot.check(formData)).toThrowError(
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
		formData.set(props.validFromFieldName, await encrypt("invalid", "SEED"));

		expect(() => honeypot.check(formData)).toThrowError(
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
			await encrypt((Date.now() + 10_000).toString(), "SEED"),
		);

		expect(honeypot.check(formData)).rejects.toThrowError(
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

		expect(() => honeypot.check(formData)).not.toThrow();
	});
});
