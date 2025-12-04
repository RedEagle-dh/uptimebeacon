"use client";

import {
	Activity,
	BarChart,
	Bell,
	CheckCircle,
	Cloud,
	Database,
	Eye,
	Gauge,
	Globe,
	type LucideIcon,
	Monitor,
	Plus,
	Radar,
	Radio,
	Satellite,
	Server,
	Shield,
	Signal,
	Trash2,
	TrendingUp,
	Wifi,
	Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api, type RouterOutputs } from "@/trpc/react";

type SiteSettings = RouterOutputs["siteSettings"]["get"];

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

interface FooterLink {
	label: string;
	href: string;
	external?: boolean;
}

interface SocialLink {
	label: string;
	href: string;
	iconName: string;
}

export function BrandingClient() {
	const utils = api.useUtils();
	const [settings] = api.siteSettings.get.useSuspenseQuery();
	const [availableIcons] =
		api.siteSettings.getAvailableIcons.useSuspenseQuery();

	const updateMutation = api.siteSettings.update.useMutation({
		onSuccess: () => {
			toast.success("Settings saved successfully");
			utils.siteSettings.get.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to save settings");
		},
	});

	// Form state
	const [siteName, setSiteName] = useState("");
	const [siteDescription, setSiteDescription] = useState("");
	const [tagline, setTagline] = useState("");
	const [iconName, setIconName] = useState("Activity");
	const [githubUrl, setGithubUrl] = useState("");
	const [copyrightText, setCopyrightText] = useState("");
	const [showMadeWith, setShowMadeWith] = useState(true);
	const [madeWithText, setMadeWithText] = useState("");

	// SEO state
	const [siteUrl, setSiteUrl] = useState("");
	const [ogImage, setOgImage] = useState("");
	const [metaKeywords, setMetaKeywords] = useState("");
	const [metaAuthor, setMetaAuthor] = useState("");
	const [robotsIndex, setRobotsIndex] = useState(true);
	const [robotsFollow, setRobotsFollow] = useState(true);
	const [googleVerification, setGoogleVerification] = useState("");
	const [bingVerification, setBingVerification] = useState("");

	// Footer links state
	const [footerNavigation, setFooterNavigation] = useState<FooterLink[]>([]);
	const [footerLegal, setFooterLegal] = useState<FooterLink[]>([]);
	const [footerSocial, setFooterSocial] = useState<SocialLink[]>([]);

	// Load settings into form
	useEffect(() => {
		if (settings) {
			setSiteName(settings.siteName);
			setSiteDescription(settings.siteDescription || "");
			setTagline(settings.tagline);
			setIconName(settings.iconName);
			setGithubUrl(settings.githubUrl || "");
			setCopyrightText(settings.copyrightText);
			setShowMadeWith(settings.showMadeWith);
			setMadeWithText(settings.madeWithText);
			setFooterNavigation(settings.footerNavigation as unknown as FooterLink[]);
			setFooterLegal(settings.footerLegal as unknown as FooterLink[]);
			setFooterSocial(settings.footerSocial as unknown as SocialLink[]);
			// SEO fields
			setSiteUrl(settings.siteUrl || "");
			setOgImage(settings.ogImage || "");
			setMetaKeywords(settings.metaKeywords || "");
			setMetaAuthor(settings.metaAuthor || "");
			setRobotsIndex(settings.robotsIndex);
			setRobotsFollow(settings.robotsFollow);
			setGoogleVerification(settings.googleVerification || "");
			setBingVerification(settings.bingVerification || "");
		}
	}, [settings]);

	const handleSave = () => {
		updateMutation.mutate({
			siteName,
			siteDescription: siteDescription || null,
			tagline,
			iconName: iconName as typeof availableIcons extends readonly (infer T)[]
				? T
				: never,
			githubUrl: githubUrl || null,
			copyrightText,
			showMadeWith,
			madeWithText,
			footerNavigation,
			footerLegal,
			footerSocial,
			// SEO fields
			siteUrl: siteUrl || null,
			ogImage: ogImage || null,
			metaKeywords: metaKeywords || null,
			metaAuthor: metaAuthor || null,
			robotsIndex,
			robotsFollow,
			googleVerification: googleVerification || null,
			bingVerification: bingVerification || null,
		});
	};

	// Helper functions for managing links
	const addNavigationLink = () => {
		setFooterNavigation([...footerNavigation, { label: "", href: "" }]);
	};

	const updateNavigationLink = (
		index: number,
		field: keyof FooterLink,
		value: string | boolean,
	) => {
		const updated = footerNavigation.map((link, i) =>
			i === index ? { ...link, [field]: value } : link,
		);
		setFooterNavigation(updated);
	};

	const removeNavigationLink = (index: number) => {
		setFooterNavigation(footerNavigation.filter((_, i) => i !== index));
	};

	const addLegalLink = () => {
		setFooterLegal([...footerLegal, { label: "", href: "" }]);
	};

	const updateLegalLink = (
		index: number,
		field: keyof FooterLink,
		value: string | boolean,
	) => {
		const updated = footerLegal.map((link, i) =>
			i === index ? { ...link, [field]: value } : link,
		);
		setFooterLegal(updated);
	};

	const removeLegalLink = (index: number) => {
		setFooterLegal(footerLegal.filter((_, i) => i !== index));
	};

	const addSocialLink = () => {
		setFooterSocial([
			...footerSocial,
			{ label: "", href: "", iconName: "Globe" },
		]);
	};

	const updateSocialLink = (
		index: number,
		field: keyof SocialLink,
		value: string,
	) => {
		const updated = footerSocial.map((link, i) =>
			i === index ? { ...link, [field]: value } : link,
		);
		setFooterSocial(updated);
	};

	const removeSocialLink = (index: number) => {
		setFooterSocial(footerSocial.filter((_, i) => i !== index));
	};

	const SelectedIcon = ICON_MAP[iconName] || Activity;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">
					Branding & Customization
				</h1>
				<p className="text-muted-foreground">
					Customize your site's appearance and footer links
				</p>
			</div>

			{/* Site Branding */}
			<Card>
				<CardHeader>
					<CardTitle>Site Branding</CardTitle>
					<CardDescription>
						Configure your site name, description, and icon
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="siteName">Site Name</Label>
							<Input
								id="siteName"
								onChange={(e) => setSiteName(e.target.value)}
								placeholder="UptimeBeacon"
								value={siteName}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="tagline">Tagline</Label>
							<Input
								id="tagline"
								onChange={(e) => setTagline(e.target.value)}
								placeholder="Monitoring"
								value={tagline}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="siteDescription">Site Description</Label>
						<Textarea
							id="siteDescription"
							onChange={(e) => setSiteDescription(e.target.value)}
							placeholder="Open-source uptime monitoring platform..."
							rows={3}
							value={siteDescription}
						/>
					</div>

					<div className="space-y-2">
						<Label>Site Icon</Label>
						<div className="flex items-center gap-4">
							<div className="flex size-12 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900">
								<SelectedIcon className="size-6 text-neutral-100" />
							</div>
							<Select onValueChange={setIconName} value={iconName}>
								<SelectTrigger className="w-48">
									<SelectValue placeholder="Select an icon" />
								</SelectTrigger>
								<SelectContent>
									{availableIcons?.map((icon) => {
										const IconComponent = ICON_MAP[icon];
										return (
											<SelectItem key={icon} value={icon}>
												<div className="flex items-center gap-2">
													{IconComponent && (
														<IconComponent className="size-4" />
													)}
													{icon}
												</div>
											</SelectItem>
										);
									})}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="githubUrl">GitHub Repository URL</Label>
						<Input
							id="githubUrl"
							onChange={(e) => setGithubUrl(e.target.value)}
							placeholder="https://github.com/your-username/your-repo"
							type="url"
							value={githubUrl}
						/>
						<p className="text-muted-foreground text-xs">
							Leave empty to hide the GitHub button in the header
						</p>
					</div>
				</CardContent>
			</Card>

			{/* SEO Settings */}
			<Card>
				<CardHeader>
					<CardTitle>SEO Settings</CardTitle>
					<CardDescription>
						Configure search engine optimization settings
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Basic SEO */}
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="siteUrl">Canonical Site URL</Label>
							<Input
								id="siteUrl"
								onChange={(e) => setSiteUrl(e.target.value)}
								placeholder="https://yourdomain.com"
								type="url"
								value={siteUrl}
							/>
							<p className="text-muted-foreground text-xs">
								Base URL for canonical links and sitemaps
							</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="metaAuthor">Meta Author</Label>
							<Input
								id="metaAuthor"
								onChange={(e) => setMetaAuthor(e.target.value)}
								placeholder="Your Company Name"
								value={metaAuthor}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="metaKeywords">Meta Keywords</Label>
						<Textarea
							id="metaKeywords"
							onChange={(e) => setMetaKeywords(e.target.value)}
							placeholder="uptime, monitoring, status page, server monitoring"
							rows={2}
							value={metaKeywords}
						/>
						<p className="text-muted-foreground text-xs">
							Comma-separated keywords (note: has limited SEO impact in modern
							search engines)
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="ogImage">Open Graph Image URL</Label>
						<Input
							id="ogImage"
							onChange={(e) => setOgImage(e.target.value)}
							placeholder="https://yourdomain.com/og-image.png"
							type="url"
							value={ogImage}
						/>
						<p className="text-muted-foreground text-xs">
							Image displayed when sharing on social media (recommended:
							1200x630px)
						</p>
					</div>

					<Separator />

					{/* Robots Meta Tag */}
					<div className="space-y-4">
						<h4 className="font-medium text-sm">Robots Meta Tag</h4>
						<div className="flex flex-col gap-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-sm">Allow Indexing</p>
									<p className="text-muted-foreground text-xs">
										Allow search engines to index your pages
									</p>
								</div>
								<Switch
									checked={robotsIndex}
									onCheckedChange={setRobotsIndex}
								/>
							</div>
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-sm">Allow Link Following</p>
									<p className="text-muted-foreground text-xs">
										Allow search engines to follow links on your pages
									</p>
								</div>
								<Switch
									checked={robotsFollow}
									onCheckedChange={setRobotsFollow}
								/>
							</div>
						</div>
					</div>

					<Separator />

					{/* Search Engine Verification */}
					<div className="space-y-4">
						<h4 className="font-medium text-sm">Search Engine Verification</h4>
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="googleVerification">
									Google Site Verification
								</Label>
								<Input
									id="googleVerification"
									onChange={(e) => setGoogleVerification(e.target.value)}
									placeholder="Enter verification code"
									value={googleVerification}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="bingVerification">Bing Site Verification</Label>
								<Input
									id="bingVerification"
									onChange={(e) => setBingVerification(e.target.value)}
									placeholder="Enter verification code"
									value={bingVerification}
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Footer Navigation Links */}
			<Card>
				<CardHeader>
					<CardTitle>Footer Navigation</CardTitle>
					<CardDescription>
						Links shown in the "Product" section of the footer
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{footerNavigation.map((link, index) => (
						<div className="flex items-end gap-3" key={index}>
							<div className="flex-1 space-y-2">
								<Label>Label</Label>
								<Input
									onChange={(e) =>
										updateNavigationLink(index, "label", e.target.value)
									}
									placeholder="Documentation"
									value={link.label}
								/>
							</div>
							<div className="flex-1 space-y-2">
								<Label>URL</Label>
								<Input
									onChange={(e) =>
										updateNavigationLink(index, "href", e.target.value)
									}
									placeholder="/docs"
									value={link.href}
								/>
							</div>
							<Button
								onClick={() => removeNavigationLink(index)}
								size="icon"
								variant="ghost"
							>
								<Trash2 className="size-4 text-destructive" />
							</Button>
						</div>
					))}
					<Button onClick={addNavigationLink} variant="outline">
						<Plus className="mr-2 size-4" />
						Add Link
					</Button>
				</CardContent>
			</Card>

			{/* Footer Legal Links */}
			<Card>
				<CardHeader>
					<CardTitle>Legal Links</CardTitle>
					<CardDescription>
						Links shown in the "Legal" section of the footer
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{footerLegal.map((link, index) => (
						<div className="flex items-end gap-3" key={index}>
							<div className="flex-1 space-y-2">
								<Label>Label</Label>
								<Input
									onChange={(e) =>
										updateLegalLink(index, "label", e.target.value)
									}
									placeholder="Privacy Policy"
									value={link.label}
								/>
							</div>
							<div className="flex-1 space-y-2">
								<Label>URL</Label>
								<Input
									onChange={(e) =>
										updateLegalLink(index, "href", e.target.value)
									}
									placeholder="/privacy"
									value={link.href}
								/>
							</div>
							<Button
								onClick={() => removeLegalLink(index)}
								size="icon"
								variant="ghost"
							>
								<Trash2 className="size-4 text-destructive" />
							</Button>
						</div>
					))}
					<Button onClick={addLegalLink} variant="outline">
						<Plus className="mr-2 size-4" />
						Add Link
					</Button>
				</CardContent>
			</Card>

			{/* Footer Social Links */}
			<Card>
				<CardHeader>
					<CardTitle>Social Links</CardTitle>
					<CardDescription>
						Social media links shown in the footer
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{footerSocial.map((link, index) => (
						<div className="flex items-end gap-3" key={index}>
							<div className="w-32 space-y-2">
								<Label>Icon</Label>
								<Select
									onValueChange={(value) =>
										updateSocialLink(index, "iconName", value)
									}
									value={link.iconName}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Github">GitHub</SelectItem>
										<SelectItem value="Twitter">Twitter</SelectItem>
										<SelectItem value="Linkedin">LinkedIn</SelectItem>
										<SelectItem value="Globe">Website</SelectItem>
										<SelectItem value="Mail">Email</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex-1 space-y-2">
								<Label>Label</Label>
								<Input
									onChange={(e) =>
										updateSocialLink(index, "label", e.target.value)
									}
									placeholder="GitHub"
									value={link.label}
								/>
							</div>
							<div className="flex-1 space-y-2">
								<Label>URL</Label>
								<Input
									onChange={(e) =>
										updateSocialLink(index, "href", e.target.value)
									}
									placeholder="https://github.com/..."
									value={link.href}
								/>
							</div>
							<Button
								onClick={() => removeSocialLink(index)}
								size="icon"
								variant="ghost"
							>
								<Trash2 className="size-4 text-destructive" />
							</Button>
						</div>
					))}
					<Button onClick={addSocialLink} variant="outline">
						<Plus className="mr-2 size-4" />
						Add Social Link
					</Button>
				</CardContent>
			</Card>

			{/* Copyright & Made With */}
			<Card>
				<CardHeader>
					<CardTitle>Copyright & Attribution</CardTitle>
					<CardDescription>Customize the footer copyright text</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="copyrightText">Copyright Text</Label>
						<Input
							id="copyrightText"
							onChange={(e) => setCopyrightText(e.target.value)}
							placeholder="{year} UptimeBeacon. All rights reserved."
							value={copyrightText}
						/>
						<p className="text-muted-foreground text-xs">
							Use {"{year}"} as a placeholder for the current year
						</p>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Show "Made with" section</p>
							<p className="text-muted-foreground text-sm">
								Display the "Made with heart" attribution in footer
							</p>
						</div>
						<Switch checked={showMadeWith} onCheckedChange={setShowMadeWith} />
					</div>

					{showMadeWith && (
						<div className="space-y-2">
							<Label htmlFor="madeWithText">Made With Text</Label>
							<Input
								id="madeWithText"
								onChange={(e) => setMadeWithText(e.target.value)}
								placeholder="Open Source"
								value={madeWithText}
							/>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Save Button */}
			<div className="flex justify-end">
				<Button
					disabled={updateMutation.isPending}
					onClick={handleSave}
					size="lg"
				>
					{updateMutation.isPending ? "Saving..." : "Save Changes"}
				</Button>
			</div>
		</div>
	);
}
