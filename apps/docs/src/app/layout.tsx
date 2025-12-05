import { Banner, Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import "nextra-theme-docs/style.css";
import type { Metadata } from "next";
import Logo from "./components/logo";

export const metadata: Metadata = {
	title: "UptimeBeacon Documentation - User Guide & Setup",
	description:
		"Complete documentation for UptimeBeacon uptime monitoring. Learn how to set up monitors, configure notifications, create status pages, and manage incidents for your websites and services.",
	keywords:
		"UptimeBeacon documentation, uptime monitoring guide, website monitoring, server monitoring, status page setup, incident management, notification alerts, HTTP monitoring, SSL monitoring, performance monitoring, uptime tracking",
	authors: [{ name: "UptimeBeacon Team" }],
	creator: "UptimeBeacon",
	publisher: "UptimeBeacon",
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	openGraph: {
		title: "UptimeBeacon Documentation - Complete User Guide",
		description:
			"Official documentation for UptimeBeacon. Learn how to monitor your websites, APIs, and services with detailed guides on setup, configuration, and best practices.",
		url: "https://docs.uptimebeacon.com",
		siteName: "UptimeBeacon Documentation",
		type: "website",
		locale: "en_US",
		images: [
			{
				url: "/og-image.png",
				width: 1200,
				height: 630,
				alt: "UptimeBeacon Documentation",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "UptimeBeacon Docs - Uptime Monitoring Guide",
		description:
			"Official documentation for UptimeBeacon. Monitor websites, APIs, and services with ease.",
		images: ["/og-image.png"],
		creator: "@uptimebeacon",
	},
	alternates: {
		canonical: "https://docs.uptimebeacon.com",
	},
	category: "Documentation",
	classification: "Software Documentation, User Guide, Tutorial",
	applicationName: "UptimeBeacon Documentation",
	generator: "Next.js",
	referrer: "origin-when-cross-origin",
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	metadataBase: new URL("https://docs.uptimebeacon.com"),
	icons: [
		{ rel: "icon", url: "/favicon.ico" },
		{
			rel: "icon",
			type: "image/png",
			sizes: "32x32",
			url: "/favicon-32x32.png",
		},
		{
			rel: "icon",
			type: "image/png",
			sizes: "16x16",
			url: "/favicon-16x16.png",
		},
		{ rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
	],
	manifest: "/site.webmanifest",
	other: {
		"primary-language": "en-US",
		"documentation-version": "1.0.0",
		"last-updated": new Date().toISOString(),
	},
};

const banner = (
	<Banner storageKey="docs-v1">
		📚 Welcome to UptimeBeacon Documentation - Monitor your services with
		confidence!
	</Banner>
);
const navbar = (
	<Navbar
		logo={
			<div className="flex items-center gap-2">
				<Logo width={28} />
				<span className="font-bold">UptimeBeacon</span>
			</div>
		}
		projectIcon={<Logo width={28} />}
		projectLink="https://uptimebeacon.com"
	/>
);
const footer = (
	<Footer>
		<div className="flex flex-wrap items-center justify-between">
			<span>
				{new Date().getFullYear()} © UptimeBeacon - All Rights Reserved
			</span>
			<span className="text-sm opacity-80">
				Documentation v1.0.0 | Last updated:{" "}
				{new Date().toLocaleDateString("en-US")}
			</span>
		</div>
	</Footer>
);

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const GITHUB_BASE_URL =
		process.env.GITHUB_BASE_URL ??
		"https://github.com/yourusername/uptimebeacon/tree/main/apps/docs";

	return (
		<html dir="ltr" lang="en" suppressHydrationWarning>
			<Head>{/* Additional head tags */}</Head>
			<body>
				<Layout
					banner={banner}
					docsRepositoryBase={GITHUB_BASE_URL}
					footer={footer}
					navbar={navbar}
					pageMap={await getPageMap()}
				>
					{children}
				</Layout>
			</body>
		</html>
	);
}
