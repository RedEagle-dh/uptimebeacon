"use client";

import { Bell, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CHANNEL_COLORS } from "@/lib/constants";
import { api, type RouterOutputs } from "@/trpc/react";

import { CHANNEL_ICONS } from "./ChannelIcons";

type NotificationChannel = RouterOutputs["notification"]["getAll"][number];

interface NotificationChannelCardProps {
	channel: NotificationChannel;
	onEdit: (channel: NotificationChannel) => void;
}

export function NotificationChannelCard({
	channel,
	onEdit,
}: NotificationChannelCardProps) {
	const utils = api.useUtils();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const updateMutation = api.notification.update.useMutation({
		onSuccess: () => {
			utils.notification.getAll.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update channel");
		},
	});

	const deleteMutation = api.notification.delete.useMutation({
		onSuccess: () => {
			toast.success("Notification channel deleted");
			utils.notification.getAll.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete channel");
		},
	});

	const Icon =
		CHANNEL_ICONS[channel.type as keyof typeof CHANNEL_ICONS] ?? Bell;
	const channelColor =
		CHANNEL_COLORS[channel.type as keyof typeof CHANNEL_COLORS];
	const colorClass = channelColor
		? `${channelColor.bgClass} ${channelColor.textClass}`
		: "bg-muted text-muted-foreground";
	const monitorsCount = channel._count.monitors;

	const handleDelete = () => {
		deleteMutation.mutate({ id: channel.id });
		setDeleteDialogOpen(false);
	};

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="flex items-center gap-3 font-medium text-base">
						<div className={`rounded-lg p-2 ${colorClass}`}>
							<Icon className="size-4" />
						</div>
						<div className="flex flex-col">
							<span>{channel.name}</span>
							{channel.isDefault && (
								<Badge className="mt-1 w-fit text-xs" variant="secondary">
									Default
								</Badge>
							)}
						</div>
					</CardTitle>
					<Switch
						checked={channel.active}
						disabled={updateMutation.isPending}
						onCheckedChange={(active) =>
							updateMutation.mutate({ id: channel.id, active })
						}
					/>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Badge variant="outline">{channel.type}</Badge>
							<span className="text-muted-foreground text-sm">
								{monitorsCount} monitor{monitorsCount !== 1 ? "s" : ""}
							</span>
						</div>
						<div className="flex items-center gap-1">
							<Button onClick={() => onEdit(channel)} size="sm" variant="ghost">
								<Pencil className="mr-1 size-3" />
								Edit
							</Button>
							<Button
								className="text-destructive hover:text-destructive"
								onClick={() => setDeleteDialogOpen(true)}
								size="sm"
								variant="ghost"
							>
								<Trash2 className="size-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete notification channel?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete the "{channel.name}" notification
							channel
							{monitorsCount > 0 && (
								<>
									{" "}
									and remove it from {monitorsCount} monitor
									{monitorsCount !== 1 ? "s" : ""}
								</>
							)}
							. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							disabled={deleteMutation.isPending}
							onClick={handleDelete}
						>
							{deleteMutation.isPending ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
