import { type RandomReader, generateRandomString } from "@oslojs/crypto/random";

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
	let decrypted = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv },
		key,
		ciphertext,
	);

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
	let alphabet =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

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
