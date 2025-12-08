"use client";

import { useEffect, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
	CHANNEL_COLORS,
	NOTIFICATION_CHANNEL_FIELDS,
	type NotificationChannelType,
} from "@/lib/constants";
import { api, type RouterOutputs } from "@/trpc/react";

import { ChannelConfigFields } from "./ChannelConfigFields";
import { CHANNEL_ICONS } from "./ChannelIcons";
import { ChannelTypeSelector } from "./ChannelTypeSelector";
import { type MonitorLinkConfig, MonitorLinkList } from "./MonitorLinkList";

type NotificationChannel = RouterOutputs["notification"]["getAll"][number];

interface NotificationChannelDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	channel?: NotificationChannel | null;
}

interface MonitorLinkConfigWithOriginal extends MonitorLinkConfig {
	originallyLinked?: boolean;
}

export function NotificationChannelDialog({
	open,
	onOpenChange,
	channel,
}: NotificationChannelDialogProps) {
	const utils = api.useUtils();
	const isEditMode = !!channel;

	const [type, setType] = useState<NotificationChannelType>("RESEND");
	const [name, setName] = useState("");
	const [isDefault, setIsDefault] = useState(false);
	const [config, setConfig] = useState<Record<string, string>>({});
	const [monitorLinks, setMonitorLinks] = useState<
		MonitorLinkConfigWithOriginal[]
	>([]);

	// Fetch channel details for edit mode
	const { data: channelDetails } = api.notification.getById.useQuery(
		{ id: channel?.id ?? "" },
		{ enabled: open && isEditMode && !!channel?.id },
	);

	const { data: monitors } = api.monitor.getAll.useQuery(undefined, {
		enabled: open,
	});

	// Initialize/reset form
	useEffect(() => {
		if (!open) return;

		if (isEditMode && channelDetails && monitors) {
			// Edit mode: populate from existing channel
			setType(channelDetails.type as NotificationChannelType);
			setName(channelDetails.name);
			setIsDefault(channelDetails.isDefault);

			// Parse config
			const configData = channelDetails.config as Record<string, unknown>;
			const stringConfig: Record<string, string> = {};
			for (const [key, value] of Object.entries(configData)) {
				if (typeof value === "string") {
					stringConfig[key] = value;
				} else if (typeof value === "object" && value !== null) {
					stringConfig[key] = JSON.stringify(value, null, 2);
				}
			}
			setConfig(stringConfig);

			// Initialize monitor links
			const linkedMonitors = channelDetails.monitors || [];
			const initialLinks: MonitorLinkConfigWithOriginal[] = monitors.map(
				(monitor) => {
					const linkedMonitor = linkedMonitors.find(
						(lm) => lm.monitor.id === monitor.id,
					);
					return {
						monitorId: monitor.id,
						linked: !!linkedMonitor,
						notifyOnDown: linkedMonitor?.notifyOnDown ?? true,
						notifyOnUp: linkedMonitor?.notifyOnUp ?? true,
						notifyOnDegraded: linkedMonitor?.notifyOnDegraded ?? false,
						originallyLinked: !!linkedMonitor,
					};
				},
			);
			setMonitorLinks(initialLinks);
		} else if (!isEditMode) {
			// Create mode: reset form
			setType("RESEND");
			setName("");
			setIsDefault(false);
			setConfig({});
			setMonitorLinks([]);
		}
	}, [open, isEditMode, channelDetails, monitors]);

	// Mutations
	const createMutation = api.notification.create.useMutation({
		onSuccess: async (newChannel) => {
			const linksToCreate = monitorLinks.filter((link) => link.linked);
			for (const link of linksToCreate) {
				await linkMonitorMutation.mutateAsync({
					channelId: newChannel.id,
					monitorId: link.monitorId,
					notifyOnDown: link.notifyOnDown,
					notifyOnUp: link.notifyOnUp,
					notifyOnDegraded: link.notifyOnDegraded,
				});
			}
			toast.success("Notification channel created");
			utils.notification.getAll.invalidate();
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create notification channel");
		},
	});

	const updateMutation = api.notification.update.useMutation({
		onSuccess: () => {
			toast.success("Notification channel updated");
			utils.notification.getAll.invalidate();
			utils.notification.getById.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update notification channel");
		},
	});

	const linkMonitorMutation = api.notification.linkMonitor.useMutation();
	const unlinkMonitorMutation = api.notification.unlinkMonitor.useMutation();

	const handleTypeChange = (newType: NotificationChannelType) => {
		setType(newType);
		setConfig({});
	};

	const handleConfigChange = (fieldName: string, value: string) => {
		setConfig((prev) => ({ ...prev, [fieldName]: value }));
	};

	const handleMonitorLinkChange = (
		monitorId: string,
		field: keyof Omit<MonitorLinkConfig, "monitorId">,
		value: boolean,
	) => {
		setMonitorLinks((prev) => {
			const existing = prev.find((link) => link.monitorId === monitorId);
			if (existing) {
				return prev.map((link) =>
					link.monitorId === monitorId ? { ...link, [field]: value } : link,
				);
			}
			return [
				...prev,
				{
					monitorId,
					linked: field === "linked" ? value : false,
					notifyOnDown: field === "notifyOnDown" ? value : true,
					notifyOnUp: field === "notifyOnUp" ? value : true,
					notifyOnDegraded: field === "notifyOnDegraded" ? value : false,
				},
			];
		});
	};

	const validateAndGetConfig = (): Record<string, unknown> | null => {
		const channelConfig = NOTIFICATION_CHANNEL_FIELDS[type];
		for (const field of channelConfig.fields) {
			if (field.required && !config[field.name]?.trim()) {
				toast.error(`Please enter ${field.label}`);
				return null;
			}
		}

		// Parse webhook headers if present
		let finalConfig: Record<string, unknown> = { ...config };
		if (type === "WEBHOOK" && config.webhookHeaders) {
			try {
				const headers = JSON.parse(config.webhookHeaders);
				finalConfig = { ...finalConfig, webhookHeaders: headers };
			} catch {
				toast.error("Invalid JSON for webhook headers");
				return null;
			}
		}

		return finalConfig;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.error("Please enter a name");
			return;
		}

		const finalConfig = validateAndGetConfig();
		if (!finalConfig) return;

		if (isEditMode && channel) {
			try {
				await updateMutation.mutateAsync({
					id: channel.id,
					name: name.trim(),
					config: finalConfig,
					isDefault,
				});

				// Handle monitor link changes
				for (const link of monitorLinks) {
					if (link.linked && !link.originallyLinked) {
						await linkMonitorMutation.mutateAsync({
							channelId: channel.id,
							monitorId: link.monitorId,
							notifyOnDown: link.notifyOnDown,
							notifyOnUp: link.notifyOnUp,
							notifyOnDegraded: link.notifyOnDegraded,
						});
					} else if (!link.linked && link.originallyLinked) {
						await unlinkMonitorMutation.mutateAsync({
							channelId: channel.id,
							monitorId: link.monitorId,
						});
					} else if (link.linked && link.originallyLinked) {
						await linkMonitorMutation.mutateAsync({
							channelId: channel.id,
							monitorId: link.monitorId,
							notifyOnDown: link.notifyOnDown,
							notifyOnUp: link.notifyOnUp,
							notifyOnDegraded: link.notifyOnDegraded,
						});
					}
				}

				onOpenChange(false);
			} catch {
				// Error handled by mutation
			}
		} else {
			createMutation.mutate({
				name: name.trim(),
				type,
				config: finalConfig,
				isDefault,
			});
		}
	};

	const isPending =
		createMutation.isPending ||
		updateMutation.isPending ||
		linkMonitorMutation.isPending ||
		unlinkMonitorMutation.isPending;

	const channelColor = isEditMode
		? CHANNEL_COLORS[channel?.type as keyof typeof CHANNEL_COLORS]
		: null;

	const EditIcon = isEditMode
		? CHANNEL_ICONS[channel?.type as keyof typeof CHANNEL_ICONS]
		: null;

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-h-[90vh] w-[95vw] max-w-[550px] p-4 sm:p-6">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
						{isEditMode && EditIcon && channelColor && (
							<div className={`rounded-lg p-1.5 ${channelColor.bgClass}`}>
								<EditIcon className={`size-4 ${channelColor.textClass}`} />
							</div>
						)}
						{isEditMode
							? "Edit Notification Channel"
							: "Add Notification Channel"}
					</DialogTitle>
					<DialogDescription className="text-sm">
						{isEditMode
							? "Update your notification channel settings and linked monitors."
							: "Configure a new notification channel to receive alerts when your monitors change status."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<ScrollArea className="h-[50vh] sm:h-[60vh]">
						<div className="space-y-4 py-4 pr-4">
							{!isEditMode && (
								<ChannelTypeSelector onChange={handleTypeChange} value={type} />
							)}

							<div className="space-y-2">
								<Label htmlFor="name">Name *</Label>
								<Input
									id="name"
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g., Production Alerts"
									value={name}
								/>
							</div>

							<ChannelConfigFields
								channelId={channel?.id}
								config={config}
								isEditMode={isEditMode}
								onConfigChange={handleConfigChange}
								type={
									isEditMode ? (channel?.type as NotificationChannelType) : type
								}
							/>

							<div className="flex items-center justify-between gap-4">
								<div className="min-w-0 space-y-0.5">
									<Label htmlFor="default">Set as default</Label>
									<p className="text-muted-foreground text-xs sm:text-sm">
										New monitors will use this channel by default
									</p>
								</div>
								<Switch
									checked={isDefault}
									className="shrink-0"
									id="default"
									onCheckedChange={setIsDefault}
								/>
							</div>

							<Separator />

							<MonitorLinkList
								idPrefix={isEditMode ? "edit-" : ""}
								monitorLinks={monitorLinks}
								onLinkChange={handleMonitorLinkChange}
							/>
						</div>
					</ScrollArea>

					<DialogFooter className="mt-4 flex-col gap-2 sm:flex-row sm:gap-2">
						<Button
							className="w-full sm:w-auto"
							onClick={() => onOpenChange(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							className="w-full sm:w-auto"
							disabled={isPending}
							type="submit"
						>
							{isPending
								? isEditMode
									? "Saving..."
									: "Creating..."
								: isEditMode
									? "Save Changes"
									: "Create Channel"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
