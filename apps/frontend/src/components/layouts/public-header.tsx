import {
	Activity,
	BarChart,
	Bell,
	CheckCircle,
	Cloud,
	Database,
	Eye,
	Gauge,
	Github,
	Globe,
	type LucideIcon,
	Monitor,
	Radar,
	Radio,
	Satellite,
	Server,
	Shield,
	Signal,
	TrendingUp,
	Wifi,
	Zap,
} from "lucide-react";
import Link from "next/link";

import { PublicMobileMenu } from "@/components/layouts/public-mobile-menu";
import { Button } from "@/components/ui/button";
import { type FooterLink, getSiteSettings } from "@/lib/get-site-settings";
import { auth } from "@/server/auth";

// Icon mapping
const ICON_MAP: Record<string, LucideIcon> = {
	Activity,
	Zap,
	Shield,
	Globe,
	Server,
	Database,
	Cloud,
	Monitor,
	Radio,
	Wifi,
	Signal,
	BarChart,
	TrendingUp,
	CheckCircle,
	Bell,
	Eye,
	Gauge,
	Radar,
	Satellite,
};

export async function PublicHeader() {
	const [settings, session] = await Promise.all([getSiteSettings(), auth()]);
	const Icon = ICON_MAP[settings.iconName] || Activity;
	const headerNavigation = settings.headerNavigation as FooterLink[];

	return (
		<header className="sticky top-0 z-50 w-full border-neutral-900 border-b bg-black/80 backdrop-blur-md">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<Link
					className="flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-80"
					href="/"
				>
					<div className="flex size-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-100">
						<Icon className="size-4" />
					</div>
					<span className="font-bold text-lg text-neutral-100 tracking-tight">
						{settings.siteName}
					</span>
				</Link>

				<nav className="flex items-center gap-3">
					{/* Additional navigation links */}
					{headerNavigation.map((link) => (
						<Button
							asChild
							className="hidden sm:inline-flex"
							key={link.href}
							size="sm"
							variant="ghost"
						>
							<Link
								href={link.href}
								{...(link.external && {
									target: "_blank",
									rel: "noopener noreferrer",
								})}
							>
								{link.label}
							</Link>
						</Button>
					))}

					{/* GitHub link */}
					{settings.githubUrl && (
						<Button
							asChild
							className="hidden sm:inline-flex"
							size="sm"
							variant="ghost"
						>
							<Link
								href={settings.githubUrl}
								rel="noopener noreferrer"
								target="_blank"
							>
								<Github className="mr-2 size-4" />
								GitHub
							</Link>
						</Button>
					)}

					{session ? (
						<Button asChild className="hidden sm:inline-flex" size="sm">
							<Link href="/dashboard">Dashboard</Link>
						</Button>
					) : (
						<>
							<Button
								asChild
								className="hidden sm:inline-flex"
								size="sm"
								variant="ghost"
							>
								<Link href="/auth/login">Sign in</Link>
							</Button>
							<Button asChild className="hidden sm:inline-flex" size="sm">
								<Link href="/auth/register">Get Started</Link>
							</Button>
						</>
					)}

					{/* Mobile menu */}
					<PublicMobileMenu
						githubUrl={settings.githubUrl}
						headerNavigation={headerNavigation}
						isAuthenticated={!!session}
					/>
				</nav>
			</div>
		</header>
	);
}
