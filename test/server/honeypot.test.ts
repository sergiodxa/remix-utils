import { describe } from "vitest";
import CryptoJS from "crypto-js";

import { Honeypot, SpamError } from "../../src";

describe(Honeypot.name, () => {
  test("generates input props", () => {
    let props = new Honeypot().getInputProps();
    expect(props).toEqual({
      nameFieldName: "honeypot",
      validFromFieldName: "honeypot_from",
      encryptedValidFrom: expect.any(String),
    });
  });

  test("uses randomized nameFieldName", () => {
    let honeypot = new Honeypot({ randomizeNameFieldName: true });
    let props = honeypot.getInputProps();
    expect(props.nameFieldName.startsWith("honeypot_")).toBeTruthy();
  });

  test("uses randomized nameFieldName with prefix", () => {
    let honeypot = new Honeypot({
      randomizeNameFieldName: true,
      nameFieldName: "prefix",
    });
    let props = honeypot.getInputProps();
    expect(props.nameFieldName.startsWith("prefix_")).toBeTruthy();
  });

  test("checks validity on FormData", () => {
    let formData = new FormData();
    let result = new Honeypot().check(formData);
    expect(result).toBeUndefined();
  });

  test("checks validity of FormData with encrypted timestamp and randomized field name", () => {
    let honeypot = new Honeypot({ randomizeNameFieldName: true });

    let props = honeypot.getInputProps();

    let formData = new FormData();
    formData.set(props.nameFieldName, "");
    formData.set(props.validFromFieldName, props.encryptedValidFrom);

    expect(honeypot.check(formData)).toBeUndefined();
  });

  test("fails validity check if input is not present", () => {
    let honeypot = new Honeypot();

    let formData = new FormData();
    formData.set(
      honeypot.getInputProps().validFromFieldName,
      honeypot.getInputProps().encryptedValidFrom
    );

    expect(() => honeypot.check(formData)).toThrowError(
      new SpamError("Missing honeypot input")
    );
  });

  test("fails validity check if input is not empty", () => {
    let honeypot = new Honeypot();
    let props = honeypot.getInputProps();

    let formData = new FormData();
    formData.set(props.nameFieldName, "not empty");

    expect(() => honeypot.check(formData)).toThrowError(
      new SpamError("Honeypot input not empty")
    );
  });

  test("fails if valid from timestamp is missing", () => {
    let honeypot = new Honeypot({ validFromTimestamp: Date.now() });
    let props = honeypot.getInputProps();

    let formData = new FormData();
    formData.set(props.nameFieldName, "");

    expect(() => honeypot.check(formData)).toThrowError(
      new SpamError("Missing honeypot valid from input")
    );
  });

  test("fails if the timestamp is not valid", () => {
    let honeypot = new Honeypot({
      validFromTimestamp: Date.now(),
      encryptionSeed: "SEED",
    });
    let props = honeypot.getInputProps();

    let formData = new FormData();
    formData.set(props.nameFieldName, "");
    formData.set(
      props.validFromFieldName,
      CryptoJS.AES.encrypt("invalid", "SEED").toString()
    );

    expect(() => honeypot.check(formData)).toThrowError(
      new SpamError("Invalid honeypot valid from input")
    );
  });

  test("fails if valid from timestamp is in the future", () => {
    let honeypot = new Honeypot({
      validFromTimestamp: Date.now(),
      encryptionSeed: "SEED",
    });

    let props = honeypot.getInputProps();

    let formData = new FormData();
    formData.set(props.nameFieldName, "");
    formData.set(
      props.validFromFieldName,
      CryptoJS.AES.encrypt((Date.now() + 10_000).toString(), "SEED").toString()
    );

    expect(() => honeypot.check(formData)).toThrowError(
      new SpamError("Honeypot valid from is in future")
    );
  });
});
