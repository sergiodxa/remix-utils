/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/csrf-server` and `bunx shadcn@latest add @remix-utils/csrf-react`.
 *
 * > [!NOTE]
 * > This depends on `react`, `@oslojs/crypto`, `@oslojs/encoding`, and React Router.
 *
 * The CSRF related functions let you implement CSRF protection on your application.
 *
 * This part of Remix Utils needs React and server-side code.
 *
 * First create a new CSRF instance.
 *
 * ```ts
 * // app/utils/csrf.server.ts
 * import { CSRF } from "remix-utils/csrf/server";
 * import { createCookie } from "react-router"; // or cloudflare/deno
 *
 * export const cookie = createCookie("csrf", {
 * 	path: "/",
 * 	httpOnly: true,
 * 	secure: process.env.NODE_ENV === "production",
 * 	sameSite: "lax",
 * 	secrets: ["s3cr3t"],
 * });
 *
 * export const csrf = new CSRF({
 * 	cookie,
 * 	// what key in FormData objects will be used for the token, defaults to `csrf`
 * 	formDataKey: "csrf",
 * 	// an optional secret used to sign the token, recommended for extra safety
 * 	secret: "s3cr3t",
 * });
 * ```
 *
 * Then you can use `csrf` to generate a new token.
 *
 * ```ts
 * import { csrf } from "~/utils/csrf.server";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	let token = csrf.generate();
 * }
 * ```
 *
 * You can customize the token size by passing the byte size, the default one is 32 bytes which will give you a string with a length of 43 after encoding.
 *
 * ```ts
 * let token = csrf.generate(64); // customize token length
 * ```
 *
 * You will need to save this token in a cookie and also return it from the loader. For convenience, you can use the `CSRF#commitToken` helper.
 *
 * ```ts
 * import { csrf } from "~/utils/csrf.server";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	let [token, cookieHeader] = await csrf.commitToken(request);
 * 	return json({ token }, { headers: { "set-cookie": cookieHeader } });
 * }
 * ```
 *
 * > [!NOTE]
 * > You could do this on any route, but I recommend you to do it on the `root` loader.
 *
 * Now that you returned the token and set it in a cookie, you can use the `AuthenticityTokenProvider` component to provide the token to your React components.
 *
 * ```tsx
 * import { AuthenticityTokenProvider } from "remix-utils/csrf/react";
 *
 * let { csrf } = useLoaderData<LoaderData>();
 * return (
 * 	<AuthenticityTokenProvider token={csrf}>
 * 		<Outlet />
 * 	</AuthenticityTokenProvider>
 * );
 * ```
 *
 * Render it in your `root` component and wrap the `Outlet` with it.
 *
 * When you create a form in some route, you can use the `AuthenticityTokenInput` component to add the authenticity token to the form.
 *
 * ```tsx
 * import { Form } from "react-router";
 * import { AuthenticityTokenInput } from "remix-utils/csrf/react";
 *
 * export default function Component() {
 * 	return (
 * 		<Form method="post">
 * 			<AuthenticityTokenInput />
 * 			<input type="text" name="something" />
 * 		</Form>
 * 	);
 * }
 * ```
 *
 * Note that the authenticity token is only really needed for a form that mutates the data somehow. If you have a search form making a GET request, you don't need to add the authenticity token there.
 *
 * This `AuthenticityTokenInput` will get the authenticity token from the `AuthenticityTokenProvider` component and add it to the form as the value of a hidden input with the name `csrf`. You can customize the field name using the `name` prop.
 *
 * ```tsx
 * <AuthenticityTokenInput name="customName" />
 * ```
 *
 * You should only customize the name if you also changed it on `createAuthenticityToken`.
 *
 * If you need to use `useFetcher` (or `useSubmit`) instead of `Form` you can also get the authenticity token with the `useAuthenticityToken` hook.
 *
 * ```tsx
 * import { useFetcher } from "react-router";
 * import { useAuthenticityToken } from "remix-utils/csrf/react";
 *
 * export function useMarkAsRead() {
 * 	let fetcher = useFetcher();
 * 	let csrf = useAuthenticityToken();
 * 	return function submit(data) {
 * 		fetcher.submit({ csrf, ...data }, { action: "/api/mark-as-read", method: "post" });
 * 	};
 * }
 * ```
 *
 * Finally, you need to validate the authenticity token in the action that received the request.
 *
 * ```ts
 * import { CSRFError } from "remix-utils/csrf/server";
 * import { redirectBack } from "remix-utils/redirect-back";
 * import { csrf } from "~/utils/csrf.server";
 *
 * export async function action({ request }: Route.ActionArgs) {
 * 	try {
 * 		await csrf.validate(request);
 * 	} catch (error) {
 * 		if (error instanceof CSRFError) {
 * 			// handle CSRF errors
 * 		}
 * 		// handle other possible errors
 * 	}
 *
 * 	// here you know the request is valid
 * 	return redirectBack(request, { fallback: "/fallback" });
 * }
 * ```
 *
 * If you need to parse the body as FormData yourself (e.g. to support file uploads) you can also call `CSRF#validate` with the FormData and Headers objects.
 *
 * ```ts
 * let formData = await parseMultiPartFormData(request);
 * try {
 * 	await csrf.validate(formData, request.headers);
 * } catch (error) {
 * 	// handle errors
 * }
 * ```
 *
 * > [!WARNING]
 * > If you call `CSRF#validate` with the request instance, but you already read its body, it will throw an error.
 *
 * In case the CSRF validation fails, it will throw a `CSRFError` which can be used to correctly identify it against other possible errors that may get thrown.
 *
 * The list of possible error messages are:
 *
 * - `missing_token_in_cookie`: The request is missing the CSRF token in the cookie.
 * - `invalid_token_in_cookie`: The CSRF token is not valid (is not a string).
 * - `tampered_token_in_cookie`: The CSRF token doesn't match the signature.
 * - `missing_token_in_body`: The request is missing the CSRF token in the body (FormData).
 * - `mismatched_token`: The CSRF token in the cookie and the body don't match.
 *
 * You can use `error.code` to check one of the error codes above, and `error.message` to get a human friendly description.
 *
 * > [!WARNING]
 * > Don't send those error messages to the end-user, they are meant to be used for debugging purposes only.
 *
 * ---
 *
 *
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
 * @module Common/Crypto
 */
import { generateRandomString, type RandomReader } from "@oslojs/crypto/random";

/**
 * Uses Web Crypto API to encrypt a string using AES encryption.
 */
export async function encrypt(value: string, seed: string) {
	let iv = generateIV();
	let key = await deriveKeyForEncoding(seed);

	let encrypted = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		key,
		stringToArrayBuffer(value),
	);

	// Combine the IV and the ciphertext for easier handling
	let resultBuffer = new Uint8Array(iv.byteLength + encrypted.byteLength);
	resultBuffer.set(iv);
	resultBuffer.set(new Uint8Array(encrypted), iv.byteLength);

	// Encode the result to Base64 for easier storage/transfer
	return btoa(String.fromCharCode(...resultBuffer));
}

/**
 * Uses Web Crypto API to decrypt a string using AES encryption.
 */
export async function decrypt(value: string, seed: string) {
	// Decode the Base64 input
	let encryptedBuffer = base64ToArrayBuffer(value);

	// Extract the IV and ciphertext
	let ivLength = 12; // 96-bit IV for AES-GCM
	let iv = encryptedBuffer.slice(0, ivLength);
	let ciphertext = encryptedBuffer.slice(ivLength);

	let key = await deriveKeyForDecoding(seed);

	// Decrypt the ciphertext
	let decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);

	// Convert the ArrayBuffer back to a string
	return new TextDecoder().decode(decrypted);
}

export function randomString(bytes = 10) {
	let random: RandomReader = {
		read(bytes) {
			crypto.getRandomValues(bytes);
		},
	};

	/**
	 * List of characters in upper, lower, digits and special characters.
	 */
	let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

	return generateRandomString(random, alphabet, bytes);
}

// Convert a string to an ArrayBuffer
function stringToArrayBuffer(value: string) {
	return new TextEncoder().encode(value);
}

// Derive a key from the seed using SHA-256
async function deriveKeyForEncoding(seed: string) {
	let seedBuffer = stringToArrayBuffer(seed);
	let hash = await crypto.subtle.digest("SHA-256", seedBuffer);
	return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt"]);
}

async function deriveKeyForDecoding(seed: string) {
	let seedBuffer = stringToArrayBuffer(seed);
	let hash = await crypto.subtle.digest("SHA-256", seedBuffer);
	return crypto.subtle.importKey(
		"raw",
		hash,
		{ name: "AES-GCM" }, // Algorithm definition
		false, // Key is not extractable
		["encrypt", "decrypt"], // Allow both encryption and decryption
	);
}

// Generate a random initialization vector
function generateIV() {
	return crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
}

// Convert a Base64 string to an ArrayBuffer
function base64ToArrayBuffer(base64: string) {
	let binaryString = atob(base64);
	let buffer = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		buffer[i] = binaryString.charCodeAt(i);
	}
	return buffer;
}
