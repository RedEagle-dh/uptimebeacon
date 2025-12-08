import { type NextRequest, NextResponse } from "next/server";
import { decode } from "next-auth/jwt";

const PROTECTED_PATHS = ["/dashboard"];

export async function proxy(request: NextRequest) {
	const sessionToken = request.cookies.get("authjs.session-token")?.value;
	const { pathname } = request.nextUrl;

	// Skip if no session token
	if (!sessionToken) {
		return NextResponse.next();
	}

	// Check if accessing a protected route
	const isProtectedRoute = PROTECTED_PATHS.some((path) =>
		pathname.startsWith(path),
	);

	try {
		// Try to decode the JWT - if it fails, the token is invalid
		await decode({
			token: sessionToken,
			secret: process.env.AUTH_SECRET || "",
			salt: "authjs.session-token",
		});
		// Token is valid, continue
		return NextResponse.next();
	} catch {
		// JWT decryption failed - clear the invalid cookie
		const response = isProtectedRoute
			? NextResponse.redirect(new URL("/auth/login", request.url))
			: NextResponse.next();

		response.cookies.delete("authjs.session-token");
		return response;
	}
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico, site.webmanifest, robots.txt (public files)
		 * - api routes (handled separately)
		 */
		"/((?!_next/static|_next/image|favicon.ico|site.webmanifest|robots.txt|api/).*)",
	],
};
