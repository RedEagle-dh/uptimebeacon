import { type NextRequest, NextResponse } from "next/server";
import { decode } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
	const sessionToken = request.cookies.get("authjs.session-token")?.value;

	if (sessionToken) {
		try {
			// Try to decode the JWT - if it fails, the token is invalid
			await decode({
				token: sessionToken,
				secret: process.env.AUTH_SECRET || "",
				salt: "authjs.session-token",
			});
		} catch {
			// JWT decryption failed - clear the invalid cookie
			const res = NextResponse.next();
			res.cookies.delete("authjs.session-token");
			return res;
		}
	}

	return NextResponse.next();
}

export const config = {
	// Run middleware on all routes except static files and api
	matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
