import { db } from "@uptimebeacon/database";
import type { MetadataRoute } from "next";

import { getSiteSettings } from "@/lib/get-site-settings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const settings = await getSiteSettings();
	const baseUrl = settings.siteUrl || "https://example.com";

	// Static pages
	const staticPages: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 1.0,
		},
	];

	// Dynamic status pages (public only)
	try {
		const statusPages = await db.statusPage.findMany({
			where: { isPublic: true },
			select: {
				slug: true,
				updatedAt: true,
			},
		});

		const statusPageUrls: MetadataRoute.Sitemap = statusPages.map((page) => ({
			url: `${baseUrl}/status/${page.slug}`,
			lastModified: page.updatedAt,
			changeFrequency: "hourly" as const,
			priority: 0.8,
		}));

		return [...staticPages, ...statusPageUrls];
	} catch {
		// Return just static pages if database query fails
		return staticPages;
	}
}
