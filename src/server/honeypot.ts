/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/honeypot-server` and `bunx shadcn@latest add @remix-utils/honeypot-react`.
 *
 * > [!NOTE]
 * > This depends on `react` and `@oslojs/crypto`, and `@oslojs/encoding`.
 *
 * Honeypot is a simple technique to prevent spam bots from submitting forms. It works by adding a hidden field to the form that bots will fill, but humans won't.
 *
 * There's a pair of utils in Remix Utils to help you implement this.
 *
 * First, create a `honeypot.server.ts` where you will instantiate and configure your Honeypot.
 *
 * ```tsx
 * import { Honeypot } from "remix-utils/honeypot/server";
 *
 * // Create a new Honeypot instance, the values here are the defaults, you can
 * // customize them
 * export const honeypot = new Honeypot({
 * 	randomizeNameFieldName: false,
 * 	nameFieldName: "name__confirm",
 * 	validFromFieldName: "from__confirm", // null to disable it
 * 	encryptionSeed: undefined, // Ideally it should be unique even between processes
 * });
 * ```
 *
 * Then, in your `app/root` loader, call `honeypot.getInputProps()` and return it.
 *
 * ```ts
 * // app/root.tsx
 * import { honeypot } from "~/honeypot.server";
 *
 * export async function loader() {
 * 	// more code here
 * 	return json({ honeypotInputProps: honeypot.getInputProps() });
 * }
 * ```
 *
 * And in the `app/root` component render the `HoneypotProvider` component wrapping the rest of the UI.
 *
 * ```tsx
 * import { HoneypotProvider } from "remix-utils/honeypot/react";
 *
 * export default function Component() {
 * 	// more code here
 * 	return (
 * 		// some JSX
 * 		<HoneypotProvider {...honeypotInputProps}>
 * 			<Outlet />
 * 		</HoneypotProvider>
 * 		// end that JSX
 * 	);
 * }
 * ```
 *
 * Now, in every public form you want protect against spam (like a login form), render the `HoneypotInputs` component.
 *
 * ```tsx
 * import { HoneypotInputs } from "remix-utils/honeypot/react";
 *
 * function SomePublicForm() {
 * 	return (
 * 		<Form method="post">
 * 			<HoneypotInputs label="Please leave this field blank" />
 * 			{/* more inputs and some buttons * /}
 * 		</Form>
 * 	);
 * }
 * ```
 *
 * > [!NOTE]
 * > The label value above is the default one, use it to allow the label to be localized, or remove it if you don't want to change it.
 *
 * Finally, in the action the form submits to, you can call `honeypot.check`.
 *
 * ```ts
 * import { SpamError } from "remix-utils/honeypot/server";
 * import { honeypot } from "~/honeypot.server";
 *
 * export async function action({ request }) {
 * 	let formData = await request.formData();
 * 	try {
 * 		honeypot.check(formData);
 * 	} catch (error) {
 * 		if (error instanceof SpamError) {
 * 			// handle spam requests here
 * 		}
 * 		// handle any other possible error here, e.g. re-throw since nothing else
 * 		// should be thrown
 * 	}
 * 	// the rest of your action
 * }
 * ```
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Server/Honeypot
 */
import { decrypt, encrypt, randomString } from "../common/crypto.js";

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
	 * @param options The options for the input props.
	 * @param options.validFromTimestamp Since when the timestamp is valid.
	 * @returns The props to be used in the form.
	 */
	public async getInputProps({
		validFromTimestamp = Date.now(),
	} = {}): Promise<HoneypotInputProps> {
		return {
			nameFieldName: this.nameFieldName,
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

	protected shouldCheckHoneypot(formData: FormData, nameFieldName: string): boolean {
		return (
			formData.has(nameFieldName) ||
			Boolean(this.validFromFieldName && formData.has(this.validFromFieldName))
		);
	}

	protected randomValue() {
		return randomString();
	}

	protected encrypt(value: string) {
		return encrypt(value, this.encryptionSeed);
	}

	protected decrypt(value: string) {
		return decrypt(value, this.encryptionSeed);
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
