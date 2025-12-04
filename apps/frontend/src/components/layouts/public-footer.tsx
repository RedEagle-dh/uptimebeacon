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
	Heart,
	Linkedin,
	type LucideIcon,
	Mail,
	Monitor,
	Radar,
	Radio,
	Satellite,
	Server,
	Shield,
	Signal,
	TrendingUp,
	Twitter,
	Wifi,
	Zap,
} from "lucide-react";
import Link from "next/link";

import {
	type FooterLink,
	getCopyrightText,
	getSiteSettings,
	type SocialLink,
} from "@/lib/get-site-settings";

// Icon mapping for site icon
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

// Icon mapping for social links
const SOCIAL_ICON_MAP: Record<string, LucideIcon> = {
	Github,
	Twitter,
	Linkedin,
	Globe,
	Mail,
};

export async function PublicFooter() {
	const settings = await getSiteSettings();
	const Icon = ICON_MAP[settings.iconName] || Activity;
	const footerNavigation = settings.footerNavigation as FooterLink[];
	const footerLegal = settings.footerLegal as FooterLink[];
	const footerSocial = settings.footerSocial as SocialLink[];

	return (
		<footer className="border-neutral-900 border-t bg-black">
			<div className="container mx-auto px-4 py-12">
				{/* Main footer content */}
				<div className="grid gap-8 md:grid-cols-4">
					{/* Brand column */}
					<div className="md:col-span-1">
						<Link
							className="flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-80"
							href="/"
						>
							<div className="flex size-7 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400">
								<Icon className="size-3.5" />
							</div>
							<span className="font-semibold text-neutral-200">
								{settings.siteName}
							</span>
						</Link>
						{settings.siteDescription && (
							<p className="mt-3 text-neutral-500 text-sm">
								{settings.siteDescription}
							</p>
						)}

						{/* Made with section */}
						{settings.showMadeWith && (
							<p className="mt-4 flex items-center gap-1 text-neutral-500 text-sm">
								Made with
								<Heart className="size-3.5 fill-current text-red-500" />
								{settings.madeWithText}
							</p>
						)}
					</div>

					{/* Navigation links */}
					{footerNavigation.length > 0 && (
						<div>
							<h3 className="mb-3 font-medium text-neutral-200 text-sm">
								Product
							</h3>
							<nav className="flex flex-col gap-2">
								{footerNavigation.map((link) => (
									<Link
										className="text-neutral-500 text-sm transition-colors duration-200 hover:text-neutral-300"
										href={link.href}
										key={link.href}
										{...(link.external && {
											target: "_blank",
											rel: "noopener noreferrer",
										})}
									>
										{link.label}
									</Link>
								))}
							</nav>
						</div>
					)}

					{/* Legal links */}
					{footerLegal.length > 0 && (
						<div>
							<h3 className="mb-3 font-medium text-neutral-200 text-sm">
								Legal
							</h3>
							<nav className="flex flex-col gap-2">
								{footerLegal.map((link) => (
									<Link
										className="text-neutral-500 text-sm transition-colors duration-200 hover:text-neutral-300"
										href={link.href}
										key={link.href}
										{...(link.external && {
											target: "_blank",
											rel: "noopener noreferrer",
										})}
									>
										{link.label}
									</Link>
								))}
							</nav>
						</div>
					)}

					{/* Social links */}
					{footerSocial.length > 0 && (
						<div>
							<h3 className="mb-3 font-medium text-neutral-200 text-sm">
								Connect
							</h3>
							<nav className="flex flex-col gap-2">
								{footerSocial.map((link) => {
									const SocialIcon = SOCIAL_ICON_MAP[link.iconName] || Globe;
									return (
										<Link
											className="flex items-center gap-2 text-neutral-500 text-sm transition-colors duration-200 hover:text-neutral-300"
											href={link.href}
											key={link.href}
											rel="noopener noreferrer"
											target="_blank"
										>
											<SocialIcon className="size-4" />
											{link.label}
										</Link>
									);
								})}
							</nav>
						</div>
					)}
				</div>

				{/* Copyright */}
				<div className="mt-10 border-neutral-900 border-t pt-6 text-center text-neutral-600 text-xs">
					<p>&copy; {getCopyrightText(settings.copyrightText)}</p>
				</div>
			</div>
		</footer>
	);
}
