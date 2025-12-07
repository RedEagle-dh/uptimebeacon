"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";

interface CreateStatusPageDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const DAYS_OPTIONS = [
	{ value: "7", label: "7 days" },
	{ value: "14", label: "14 days" },
	{ value: "30", label: "30 days" },
	{ value: "60", label: "60 days" },
	{ value: "90", label: "90 days" },
];

export function CreateStatusPageDialog({
	open,
	onOpenChange,
}: CreateStatusPageDialogProps) {
	const utils = api.useUtils();

	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [description, setDescription] = useState("");
	const [isPublic, setIsPublic] = useState(true);
	const [showIncidentHistory, setShowIncidentHistory] = useState(true);
	const [showUptimeGraph, setShowUptimeGraph] = useState(true);
	const [daysToShow, setDaysToShow] = useState("90");
	const [logoUrl, setLogoUrl] = useState("");
	const [faviconUrl, setFaviconUrl] = useState("");

	const createMutation = api.statusPage.create.useMutation({
		onSuccess: () => {
			toast.success("Status page created successfully");
			utils.statusPage.getAll.invalidate();
			resetForm();
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create status page");
		},
	});

	const resetForm = () => {
		setName("");
		setSlug("");
		setDescription("");
		setIsPublic(true);
		setShowIncidentHistory(true);
		setShowUptimeGraph(true);
		setDaysToShow("90");
		setLogoUrl("");
		setFaviconUrl("");
	};

	const generateSlug = (value: string) => {
		return value
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");
	};

	const handleNameChange = (value: string) => {
		setName(value);
		// Auto-generate slug from name if slug hasn't been manually edited
		if (!slug || slug === generateSlug(name)) {
			setSlug(generateSlug(value));
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.error("Please enter a name");
			return;
		}

		if (!slug.trim() || slug.length < 3) {
			toast.error("Slug must be at least 3 characters");
			return;
		}

		createMutation.mutate({
			name: name.trim(),
			slug: slug.trim(),
			description: description.trim() || undefined,
			isPublic,
			showIncidentHistory,
			showUptimeGraph,
			daysToShow: parseInt(daysToShow, 10),
			logoUrl: logoUrl.trim() || undefined,
			faviconUrl: faviconUrl.trim() || undefined,
		});
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Create Status Page</DialogTitle>
					<DialogDescription>
						Create a public status page to keep your users informed about your
						services.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<ScrollArea className="h-[60vh]">
						<div className="space-y-4 py-4 pr-4">
							<div className="space-y-2">
								<Label htmlFor="name">Name *</Label>
								<Input
									id="name"
									onChange={(e) => handleNameChange(e.target.value)}
									placeholder="e.g., Acme Inc Status"
									value={name}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="slug">Slug *</Label>
								<Input
									id="slug"
									onChange={(e) => setSlug(generateSlug(e.target.value))}
									placeholder="e.g., acme-status"
									value={slug}
								/>
								<p className="text-muted-foreground text-xs">
									Your status page will be available at /status/{slug || "..."}
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<Textarea
									className="max-h-[100px] resize-none overflow-auto [overflow-wrap:anywhere] [word-break:break-all]"
									id="description"
									onChange={(e) => setDescription(e.target.value)}
									placeholder="A brief description of your status page..."
									rows={2}
									value={description}
								/>
							</div>

							<div className="space-y-4 rounded-lg border p-4">
								<h4 className="font-medium text-sm">Display Settings</h4>

								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="isPublic">Public</Label>
										<p className="text-muted-foreground text-xs">
											Make this status page visible to everyone
										</p>
									</div>
									<Switch
										checked={isPublic}
										id="isPublic"
										onCheckedChange={setIsPublic}
									/>
								</div>

								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="showIncidentHistory">
											Show Incident History
										</Label>
										<p className="text-muted-foreground text-xs">
											Display recent incidents on the page
										</p>
									</div>
									<Switch
										checked={showIncidentHistory}
										id="showIncidentHistory"
										onCheckedChange={setShowIncidentHistory}
									/>
								</div>

								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="showUptimeGraph">Show Uptime Graph</Label>
										<p className="text-muted-foreground text-xs">
											Display the uptime history visualization
										</p>
									</div>
									<Switch
										checked={showUptimeGraph}
										id="showUptimeGraph"
										onCheckedChange={setShowUptimeGraph}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="daysToShow">History Duration</Label>
									<Select onValueChange={setDaysToShow} value={daysToShow}>
										<SelectTrigger className="w-full" id="daysToShow">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{DAYS_OPTIONS.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-4 rounded-lg border p-4">
								<h4 className="font-medium text-sm">Branding (Optional)</h4>

								<div className="space-y-2">
									<Label htmlFor="logoUrl">Logo URL</Label>
									<Input
										id="logoUrl"
										onChange={(e) => setLogoUrl(e.target.value)}
										placeholder="https://example.com/logo.png"
										type="url"
										value={logoUrl}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="faviconUrl">Favicon URL</Label>
									<Input
										id="faviconUrl"
										onChange={(e) => setFaviconUrl(e.target.value)}
										placeholder="https://example.com/favicon.ico"
										type="url"
										value={faviconUrl}
									/>
								</div>
							</div>
						</div>
					</ScrollArea>

					<DialogFooter>
						<Button
							onClick={() => onOpenChange(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button disabled={createMutation.isPending} type="submit">
							{createMutation.isPending ? "Creating..." : "Create Status Page"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
