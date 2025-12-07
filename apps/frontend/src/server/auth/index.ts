import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

// Wrap auth to handle JWT decryption errors gracefully
// This happens when AUTH_SECRET changes and old cookies become invalid
const safeAuth = async () => {
	try {
		return await uncachedAuth();
	} catch (error) {
		// Check if this is a JWT decryption error
		if (
			error instanceof Error &&
			(error.message.includes("no matching decryption secret") ||
				error.message.includes("JWTSessionError"))
		) {
			// Return null to treat user as logged out
			return null;
		}
		// Re-throw other errors
		throw error;
	}
};

const auth = cache(safeAuth);

export { auth, handlers, signIn, signOut };
