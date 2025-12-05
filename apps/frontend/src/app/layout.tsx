import "@/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { getSiteSettings } from "@/lib/get-site-settings";
import { TRPCReactProvider } from "@/trpc/react";

export async function generateMetadata(): Promise<Metadata> {
	const settings = await getSiteSettings();

	return {
		title: {
			default: settings.siteName,
			template: `%s | ${settings.siteName}`,
		},
		description: settings.siteDescription || undefined,
		keywords: settings.metaKeywords || undefined,
		authors: settings.metaAuthor ? [{ name: settings.metaAuthor }] : undefined,
		icons: {
			icon: "/favicon.ico",
			shortcut: "/favicon-16x16.png",
			apple: "/apple-touch-icon.png",
		},
		manifest: "/site.webmanifest",
		robots: {
			index: settings.robotsIndex,
			follow: settings.robotsFollow,
		},
		verification: {
			google: settings.googleVerification || undefined,
			other: settings.bingVerification
				? { "msvalidate.01": settings.bingVerification }
				: undefined,
		},
		openGraph: {
			type: "website",
			locale: "en_US",
			url: settings.siteUrl || undefined,
			title: settings.siteName,
			description: settings.siteDescription || undefined,
			siteName: settings.siteName,
			images: settings.ogImage
				? [
						{
							url: settings.ogImage,
							width: 1200,
							height: 630,
							alt: settings.siteName,
						},
					]
				: undefined,
		},
		twitter: {
			card: "summary_large_image",
			title: settings.siteName,
			description: settings.siteDescription || undefined,
			images: settings.ogImage ? [settings.ogImage] : undefined,
		},
		metadataBase: settings.siteUrl ? new URL(settings.siteUrl) : undefined,
	};
}

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default async function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const settings = await getSiteSettings();

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: settings.siteName,
		description: settings.siteDescription,
		url: settings.siteUrl,
		logo: settings.ogImage,
		sameAs: settings.githubUrl ? [settings.githubUrl] : undefined,
	};

	const webAppJsonLd = {
		"@context": "https://schema.org",
		"@type": "WebApplication",
		name: settings.siteName,
		applicationCategory: "BusinessApplication",
		operatingSystem: "Web",
		description: settings.siteDescription,
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
		},
		featureList: [
			"Uptime Monitoring",
			"Status Pages",
			"Incident Management",
			"Multi-channel Notifications",
		],
	};

	return (
		<html className={`${geist.variable} dark`} lang="en">
			<head>
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: important for SEO
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
					type="application/ld+json"
				/>
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: important for SEO
					dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
					type="application/ld+json"
				/>
			</head>
			<body className="min-h-screen bg-background font-sans antialiased">
				<TRPCReactProvider>
					{children}
					<Toaster />
				</TRPCReactProvider>
			</body>
		</html>
	);
}
