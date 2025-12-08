import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte key from the provided secret using SHA-256
 */
function deriveKey(secret: string): Buffer {
	return createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 * @param plaintext - The text to encrypt
 * @param secret - The secret key (typically AUTH_SECRET)
 * @returns Base64 encoded string containing iv:authTag:ciphertext
 */
export function encrypt(plaintext: string, secret: string): string {
	const key = deriveKey(secret);
	const iv = randomBytes(IV_LENGTH);

	const cipher = createCipheriv(ALGORITHM, key, iv);
	const encrypted = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();

	// Format: iv:authTag:ciphertext (all base64)
	return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

/**
 * Decrypts a ciphertext string encrypted with the encrypt function
 * @param ciphertext - The encrypted string (iv:authTag:ciphertext format)
 * @param secret - The secret key (typically AUTH_SECRET)
 * @returns The decrypted plaintext string
 */
export function decrypt(ciphertext: string, secret: string): string {
	const key = deriveKey(secret);

	const parts = ciphertext.split(":");
	if (parts.length !== 3) {
		throw new Error("Invalid ciphertext format");
	}

	const ivBase64 = parts[0] as string;
	const authTagBase64 = parts[1] as string;
	const encryptedBase64 = parts[2] as string;
	const iv = Buffer.from(ivBase64, "base64");
	const authTag = Buffer.from(authTagBase64, "base64");
	const encrypted = Buffer.from(encryptedBase64, "base64");

	if (iv.length !== IV_LENGTH) {
		throw new Error("Invalid IV length");
	}

	if (authTag.length !== AUTH_TAG_LENGTH) {
		throw new Error("Invalid auth tag length");
	}

	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(authTag);

	const decrypted = Buffer.concat([
		decipher.update(encrypted),
		decipher.final(),
	]);

	return decrypted.toString("utf8");
}

/**
 * Checks if a string appears to be encrypted (matches our format)
 */
export function isEncrypted(value: string): boolean {
	const parts = value.split(":");
	if (parts.length !== 3) return false;

	try {
		const ivPart = parts[0] as string;
		const authTagPart = parts[1] as string;
		const iv = Buffer.from(ivPart, "base64");
		const authTag = Buffer.from(authTagPart, "base64");
		return iv.length === IV_LENGTH && authTag.length === AUTH_TAG_LENGTH;
	} catch {
		return false;
	}
}

/**
 * Masks a sensitive value for display (shows only last 4 characters)
 */
export function maskSensitiveValue(value: string): string {
	if (!value || value.length <= 4) {
		return "****";
	}
	return `****${value.slice(-4)}`;
}
