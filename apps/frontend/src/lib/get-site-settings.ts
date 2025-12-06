import { db } from "@uptimebeacon/database";
import { cache } from "react";

// Default settings for fallback
const DEFAULT_SETTINGS = {
	id: "default",
	siteName: "UptimeBeacon",
	siteDescription:
		"Open-source uptime monitoring platform. Monitor your services, track incidents, and keep your users informed with beautiful status pages.",
	tagline: "Monitoring",
	iconName: "Activity",
	siteUrl: null,
	ogImage: null,
	footerNavigation: [
		{ label: "Documentation", href: "/docs" },
		{ label: "Changelog", href: "/changelog" },
		{ label: "Status", href: "/status" },
	],
	footerLegal: [
		{ label: "Privacy Policy", href: "/privacy" },
		{ label: "Terms of Service", href: "/terms" },
	],
	footerSocial: [
		{
			label: "GitHub",
			href: "https://github.com/your-username/uptimebeacon",
			iconName: "Github",
		},
	],
	copyrightText: "{year} UptimeBeacon. All rights reserved.",
	showMadeWith: true,
	madeWithText: "Open Source",
	githubUrl: "https://github.com/your-username/uptimebeacon",
	headerNavigation: [],
	metaKeywords: null,
	metaAuthor: null,
	robotsIndex: true,
	robotsFollow: true,
	googleVerification: null,
	bingVerification: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};

export type SiteSettings = typeof DEFAULT_SETTINGS;

export interface FooterLink {
	label: string;
	href: string;
	external?: boolean;
}

export interface SocialLink {
	label: string;
	href: string;
	iconName: string;
}

/**
 * Get site settings from database with caching
 * Uses React cache() for request deduplication
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
	// Skip database access during build if DATABASE_URL is not set
	if (!process.env.DATABASE_URL) {
		return DEFAULT_SETTINGS;
	}

	try {
		const settings = await db.siteSettings.findUnique({
			where: { id: "default" },
		});

		if (!settings) {
			// Create default settings if they don't exist
			const created = await db.siteSettings.create({
				data: {
					id: "default",
					siteName: DEFAULT_SETTINGS.siteName,
					siteDescription: DEFAULT_SETTINGS.siteDescription,
					tagline: DEFAULT_SETTINGS.tagline,
					iconName: DEFAULT_SETTINGS.iconName,
					footerNavigation: DEFAULT_SETTINGS.footerNavigation,
					footerLegal: DEFAULT_SETTINGS.footerLegal,
					footerSocial: DEFAULT_SETTINGS.footerSocial,
					copyrightText: DEFAULT_SETTINGS.copyrightText,
					showMadeWith: DEFAULT_SETTINGS.showMadeWith,
					madeWithText: DEFAULT_SETTINGS.madeWithText,
					githubUrl: DEFAULT_SETTINGS.githubUrl,
					headerNavigation: DEFAULT_SETTINGS.headerNavigation,
				},
			});
			return created as SiteSettings;
		}

		return settings as SiteSettings;
	} catch (error) {
		// Return defaults if database is not available
		console.error("Failed to fetch site settings:", error);
		return DEFAULT_SETTINGS;
	}
});

/**
 * Get copyright text with year replaced
 */
export function getCopyrightText(copyrightText: string): string {
	return copyrightText.replace("{year}", new Date().getFullYear().toString());
}
