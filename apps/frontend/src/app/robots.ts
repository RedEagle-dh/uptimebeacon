import type { MetadataRoute } from "next";

import { getSiteSettings } from "@/lib/get-site-settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
	const settings = await getSiteSettings();
	const baseUrl = settings.siteUrl || "https://example.com";

	// If noindex is set, disallow all crawling
	if (!settings.robotsIndex) {
		return {
			rules: {
				userAgent: "*",
				disallow: "/",
			},
		};
	}

	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/api/", "/dashboard/", "/auth/"],
			},
		],
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}
