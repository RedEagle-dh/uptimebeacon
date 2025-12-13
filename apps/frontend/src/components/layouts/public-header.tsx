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
							className="hidden sm:inline-flex"
							key={link.href}
							nativeButton={false}
							render={
								<Link
									href={link.href}
									{...(link.external && {
										target: "_blank",
										rel: "noopener noreferrer",
									})}
								/>
							}
							size="sm"
							variant="ghost"
						>
							{link.label}
						</Button>
					))}

					{/* GitHub link */}
					{settings.githubUrl && (
						<Button
							className="hidden sm:inline-flex"
							nativeButton={false}
							render={
								<Link
									href={settings.githubUrl}
									rel="noopener noreferrer"
									target="_blank"
								/>
							}
							size="sm"
							variant="ghost"
						>
							<Github className="mr-2 size-4" />
							GitHub
						</Button>
					)}

					{session ? (
						<Button
							className="hidden sm:inline-flex"
							nativeButton={false}
							render={<Link href="/dashboard" />}
							size="sm"
						>
							Dashboard
						</Button>
					) : (
						<>
							<Button
								className="hidden sm:inline-flex"
								nativeButton={false}
								render={<Link href="/auth/login" />}
								size="sm"
								variant="ghost"
							>
								Sign in
							</Button>
							<Button
								className="hidden sm:inline-flex"
								nativeButton={false}
								render={<Link href="/auth/register" />}
								size="sm"
							>
								Get Started
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
