import { NextResponse } from "next/server";

import { getSiteSettings } from "@/lib/get-site-settings";

export async function GET() {
	const settings = await getSiteSettings();

	const manifest = {
		name: settings.siteName,
		short_name: settings.siteName,
		description: settings.siteDescription,
		start_url: "/",
		display: "standalone",
		background_color: "#0a0a0a",
		theme_color: "#0a0a0a",
		icons: [
			{
				src: "/favicon.ico",
				sizes: "any",
				type: "image/x-icon",
			},
		],
	};

	return NextResponse.json(manifest, {
		headers: {
			"Content-Type": "application/manifest+json",
		},
	});
}
