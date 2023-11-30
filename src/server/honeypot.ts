import { fromUint8Array, toUint8Array } from "js-base64";

const textEncoder = new globalThis.TextEncoder();
const textDecoder = new globalThis.TextDecoder();

export interface HoneypotInputProps {
	nameFieldName: string;
	validFromFieldName: string | null;
	encryptedValidFrom: string;
}

export interface HoneypotConfig {
	randomizeNameFieldName?: boolean;
	nameFieldName?: string;
	validFromFieldName?: string | null;
	/**
	 * HKDF SHA-256 secret key for signing the honeypot, a string with 256 bits (32 bytes) of entropy
	 */
	encryptionSeed?: string;
	/**
	 * Optional WebCrypto polyfill for enviroments without native support.
	 */
	webCrypto?: Crypto;
}

export class SpamError extends Error {}

let DEFAULT_NAME_FIELD_NAME = "name__confirm";
let DEFAULT_VALID_FROM_FIELD_NAME = "from__confirm";

export class Honeypot {
	private config: HoneypotConfig;
	private masterKey?: CryptoKey;
	private webCrypto: Crypto;

	constructor(protected honeypotConfig: HoneypotConfig = {}) {
		this.webCrypto = honeypotConfig.webCrypto ?? globalThis.crypto;
		this.config = honeypotConfig as HoneypotConfig;
	}

	public async getInputProps({
		validFromTimestamp = Date.now(),
	} = {}): Promise<HoneypotInputProps> {
		return {
			nameFieldName: await this.getNameFieldName(),
			validFromFieldName: this.validFromFieldName,
			encryptedValidFrom: await this.encrypt(validFromTimestamp.toString()),
		};
	}

	public async check(formData: FormData) {
		let nameFieldName = this.config.nameFieldName ?? DEFAULT_NAME_FIELD_NAME;
		if (this.config.randomizeNameFieldName) {
			let actualName = this.getRandomizedNameFieldName(nameFieldName, formData);
			if (actualName) nameFieldName = actualName;
		}

		if (!this.shouldCheckHoneypot(formData, nameFieldName)) return;

		if (!formData.has(nameFieldName)) {
			throw new SpamError("Missing honeypot input");
		}

		let honeypotValue = formData.get(nameFieldName);

		if (honeypotValue !== "") throw new SpamError("Honeypot input not empty");
		if (!this.validFromFieldName) return;

		let validFrom = formData.get(this.validFromFieldName);

		if (!validFrom) throw new SpamError("Missing honeypot valid from input");

		let time = await this.decrypt(validFrom as string);
		if (!time) throw new SpamError("Invalid honeypot valid from input");
		if (!this.isValidTimeStamp(Number(time))) {
			throw new SpamError("Invalid honeypot valid from input");
		}

		if (this.isFuture(Number(time))) {
			throw new SpamError("Honeypot valid from is in future");
		}
	}

	protected async getNameFieldName() {
		let fieldName = this.config.nameFieldName ?? DEFAULT_NAME_FIELD_NAME;
		if (!this.config.randomizeNameFieldName) return fieldName;
		return `${fieldName}_${await this.randomValue()}`;
	}

	protected get validFromFieldName() {
		if (this.config.validFromFieldName === undefined) {
			return DEFAULT_VALID_FROM_FIELD_NAME;
		}
		return this.config.validFromFieldName;
	}

	protected getRandomizedNameFieldName(
		nameFieldName: string,
		formData: FormData,
	): string | undefined {
		for (let key of formData.keys()) {
			if (!key.startsWith(nameFieldName)) continue;
			return key;
		}
	}

	protected shouldCheckHoneypot(
		formData: FormData,
		nameFieldName: string,
	): boolean {
		return (
			formData.has(nameFieldName) ||
			Boolean(this.validFromFieldName && formData.has(this.validFromFieldName))
		);
	}

	/**
	 * Derive keys using HKDF because AES-GCM alone can only encrypt ~1 billion messages with the same secret
	 */
	protected async getMasterKey() {
		if (!this.masterKey) {
			this.masterKey = await this.webCrypto.subtle.importKey(
				"raw",
				textEncoder.encode(
					this.honeypotConfig.encryptionSeed ?? (await this.randomValue()),
				),
				{
					name: "HKDF",
					hash: "SHA-256",
				},
				false,
				["deriveKey"],
			);
		}
		return this.masterKey;
	}

	protected async randomValue() {
		let array = new Uint8Array(32); // 256 bits
		this.webCrypto.getRandomValues(array);
		return fromUint8Array(array, true);
	}

	protected async encrypt(value: string) {
		// Generate a unique salt for each encryption
		let salt = this.webCrypto.getRandomValues(new Uint8Array(16));

		// Derive a key using HKDF
		let derivedKey = await this.webCrypto.subtle.deriveKey(
			{
				name: "HKDF",
				hash: "SHA-256",
				salt: salt,
				info: new ArrayBuffer(0),
			},
			await this.getMasterKey(),
			{ name: "AES-GCM", length: 256 },
			false,
			["encrypt"],
		);

		let iv = this.webCrypto.getRandomValues(new Uint8Array(12)); // Generate a new IV
		let encoded = textEncoder.encode(value);
		let encrypted = await this.webCrypto.subtle.encrypt(
			{ name: "AES-GCM", iv: iv },
			derivedKey,
			encoded,
		);

		let saltIvAndEncrypted = new Uint8Array(
			salt.byteLength + iv.byteLength + encrypted.byteLength,
		);
		saltIvAndEncrypted.set(new Uint8Array(salt), 0);
		saltIvAndEncrypted.set(new Uint8Array(iv), salt.byteLength);
		saltIvAndEncrypted.set(
			new Uint8Array(encrypted),
			salt.byteLength + iv.byteLength,
		);

		return fromUint8Array(saltIvAndEncrypted, true);
	}

	protected async decrypt(value: string) {
		let saltIvAndEncrypted = toUint8Array(value).buffer;
		let salt = saltIvAndEncrypted.slice(0, 16); // Extract the salt (first 16 bytes)
		let iv = saltIvAndEncrypted.slice(16, 28); // Extract the IV (next 12 bytes)
		let encrypted = saltIvAndEncrypted.slice(28); // Extract the encrypted data

		// Derive the key using the same HKDF parameters and salt
		let derivedKey = await this.webCrypto.subtle.deriveKey(
			{
				name: "HKDF",
				hash: "SHA-256",
				salt: new Uint8Array(salt),
				info: new ArrayBuffer(0),
			},
			await this.getMasterKey(),
			{ name: "AES-GCM", length: 256 },
			false,
			["decrypt"],
		);

		let decrypted = await this.webCrypto.subtle.decrypt(
			{ name: "AES-GCM", iv: new Uint8Array(iv) },
			derivedKey,
			encrypted,
		);

		return textDecoder.decode(decrypted);
	}

	protected isFuture(timestamp: number) {
		return timestamp > Date.now();
	}

	protected isValidTimeStamp(timestampp: number) {
		if (Number.isNaN(timestampp)) return false;
		if (timestampp <= 0) return false;
		if (timestampp >= Number.MAX_SAFE_INTEGER) return false;
		return true;
	}
}
