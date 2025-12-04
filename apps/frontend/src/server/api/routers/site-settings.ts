import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
	adminProcedure,
	createTRPCRouter,
	publicProcedure,
} from "@/server/api/trpc";

// Schema for footer links
const footerLinkSchema = z.object({
	label: z.string(),
	href: z.string(),
	external: z.boolean().optional(),
});

// Schema for social links
const socialLinkSchema = z.object({
	label: z.string(),
	href: z.string(),
	iconName: z.string(), // Lucide icon name
});

// Available icons for the site
export const AVAILABLE_ICONS = [
	"Activity",
	"Zap",
	"Shield",
	"Globe",
	"Server",
	"Database",
	"Cloud",
	"Monitor",
	"Radio",
	"Wifi",
	"Signal",
	"BarChart",
	"TrendingUp",
	"CheckCircle",
	"Bell",
	"Eye",
	"Gauge",
	"Radar",
	"Satellite",
] as const;

export const siteSettingsRouter = createTRPCRouter({
	// Get site settings (public - needed for header/footer)
	get: publicProcedure.query(async ({ ctx }) => {
		let settings = await ctx.db.siteSettings.findUnique({
			where: { id: "default" },
		});

		// Create default settings if they don't exist
		if (!settings) {
			settings = await ctx.db.siteSettings.create({
				data: {
					id: "default",
					siteName: "UptimeBeacon",
					siteDescription:
						"Open-source uptime monitoring platform. Monitor your services, track incidents, and keep your users informed with beautiful status pages.",
					tagline: "Monitoring",
					iconName: "Activity",
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
				},
			});
		}

		return settings;
	}),

	// Update site settings (admin only)
	update: adminProcedure
		.input(
			z.object({
				siteName: z.string().min(1).max(100).optional(),
				siteDescription: z.string().max(500).optional().nullable(),
				tagline: z.string().max(50).optional(),
				iconName: z.enum(AVAILABLE_ICONS).optional(),
				siteUrl: z.string().url().optional().nullable(),
				ogImage: z.string().optional().nullable(),
				footerNavigation: z.array(footerLinkSchema).optional(),
				footerLegal: z.array(footerLinkSchema).optional(),
				footerSocial: z.array(socialLinkSchema).optional(),
				copyrightText: z.string().max(200).optional(),
				showMadeWith: z.boolean().optional(),
				madeWithText: z.string().max(50).optional(),
				githubUrl: z.string().url().optional().nullable(),
				headerNavigation: z.array(footerLinkSchema).optional(),
				metaKeywords: z.string().max(500).optional().nullable(),
				metaAuthor: z.string().max(100).optional().nullable(),
				robotsIndex: z.boolean().optional(),
				robotsFollow: z.boolean().optional(),
				googleVerification: z.string().max(100).optional().nullable(),
				bingVerification: z.string().max(100).optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Ensure settings exist
			const existing = await ctx.db.siteSettings.findUnique({
				where: { id: "default" },
			});

			if (!existing) {
				// Create with the input values
				return ctx.db.siteSettings.create({
					data: {
						id: "default",
						...input,
					},
				});
			}

			// Update existing settings
			return ctx.db.siteSettings.update({
				where: { id: "default" },
				data: input,
			});
		}),

	// Get available icons
	getAvailableIcons: publicProcedure.query(() => {
		return AVAILABLE_ICONS;
	}),
});
