import CryptoJS from "crypto-js";

export interface HoneypotInputProps {
	/**
	 * The name expected to be used by the honeypot input field.
	 */
	nameFieldName: string;
	/**
	 * The name expected to be used by the honeypot valid from input field.
	 */
	validFromFieldName: string | null;
	/**
	 * The encrypted value of the current timestamp.
	 */
	encryptedValidFrom: string;
}

export interface HoneypotConfig {
	/**
	 * Enable randomization of the name field name, this way the honeypot field
	 * name will be different for each request.
	 */
	randomizeNameFieldName?: boolean;
	/**
	 * The name of the field that will be used for the honeypot input.
	 */
	nameFieldName?: string;
	/**
	 * The name of the field that will be used for the honeypot valid from input.
	 */
	validFromFieldName?: string | null;
	/**
	 * The seed used for the encryption of the valid from timestamp.
	 */
	encryptionSeed?: string;
}

/**
 * The error thrown when the Honeypot fails, meaning some automated bot filled
 * the form and the request is probably spam.
 */
export class SpamError extends Error {
	override readonly name = "SpamError";
}

const DEFAULT_NAME_FIELD_NAME = "name__confirm";
const DEFAULT_VALID_FROM_FIELD_NAME = "from__confirm";

/**
 * Module used to implement a Honeypot.
 * A Honeypot is a visually hidden input that is used to detect spam bots. This
 * field is expected to be left empty by users because they don't see it, but
 * bots will fill it falling in the honeypot trap.
 */
export class Honeypot {
	private generatedEncryptionSeed = this.randomValue();

	protected config: HoneypotConfig;

	constructor(config: HoneypotConfig = {}) {
		this.config = config;
	}

	/**
	 * Get the HoneypotInputProps to be used in your forms.
	 * @param {Object} options The options for the input props.
	 * @param {number} options.validFromTimestamp Since when the timestamp is valid.
	 * @returns {HoneypotInputProps} The props to be used in the form.
	 */
	public getInputProps({
		validFromTimestamp = Date.now(),
	} = {}): HoneypotInputProps {
		return {
			nameFieldName: this.nameFieldName,
			validFromFieldName: this.validFromFieldName,
			encryptedValidFrom: this.encrypt(validFromTimestamp.toString()),
		};
	}

	public check(formData: FormData) {
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

		let time = this.decrypt(validFrom as string);
		if (!time) throw new SpamError("Invalid honeypot valid from input");
		if (!this.isValidTimeStamp(Number(time))) {
			throw new SpamError("Invalid honeypot valid from input");
		}

		if (this.isFuture(Number(time))) {
			throw new SpamError("Honeypot valid from is in future");
		}
	}

	protected get nameFieldName() {
		let fieldName = this.config.nameFieldName ?? DEFAULT_NAME_FIELD_NAME;
		if (!this.config.randomizeNameFieldName) return fieldName;
		return `${fieldName}_${this.randomValue()}`;
	}

	protected get validFromFieldName() {
		if (this.config.validFromFieldName === undefined) {
			return DEFAULT_VALID_FROM_FIELD_NAME;
		}
		return this.config.validFromFieldName;
	}

	protected get encryptionSeed() {
		return this.config.encryptionSeed ?? this.generatedEncryptionSeed;
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

	protected randomValue() {
		return CryptoJS.lib.WordArray.random(128 / 8).toString();
	}

	protected encrypt(value: string) {
		return CryptoJS.AES.encrypt(value, this.encryptionSeed).toString();
	}

	protected decrypt(value: string) {
		return CryptoJS.AES.decrypt(value, this.encryptionSeed).toString(
			CryptoJS.enc.Utf8,
		);
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
