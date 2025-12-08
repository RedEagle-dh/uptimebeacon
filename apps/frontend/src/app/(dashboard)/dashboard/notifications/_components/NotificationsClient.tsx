"use client";

import { Bell, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api, type RouterOutputs } from "@/trpc/react";

import { NotificationChannelCard } from "./NotificationChannelCard";
import { NotificationChannelDialog } from "./NotificationChannelDialog";

type NotificationChannel = RouterOutputs["notification"]["getAll"][number];

export function NotificationsClient() {
	const [channels] = api.notification.getAll.useSuspenseQuery();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedChannel, setSelectedChannel] =
		useState<NotificationChannel | null>(null);

	const handleCreate = () => {
		setSelectedChannel(null);
		setDialogOpen(true);
	};

	const handleEdit = (channel: NotificationChannel) => {
		setSelectedChannel(channel);
		setDialogOpen(true);
	};

	const handleDialogClose = (open: boolean) => {
		setDialogOpen(open);
		if (!open) {
			setSelectedChannel(null);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Notifications</h1>
					<p className="text-muted-foreground text-sm sm:text-base">
						Configure how you receive alerts when your monitors change status
					</p>
				</div>
				<Button className="w-full sm:w-auto" onClick={handleCreate}>
					<Plus className="mr-2 size-4" />
					Add Channel
				</Button>
			</div>

			{channels.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Bell className="mb-4 size-12 text-muted-foreground" />
						<p className="mb-4 font-medium">No notification channels</p>
						<p className="mb-4 text-center text-muted-foreground text-sm">
							Add notification channels to get alerted when your services go
							down
						</p>
						<Button onClick={handleCreate}>
							<Plus className="mr-2 size-4" />
							Add your first channel
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2">
					{channels.map((channel) => (
						<NotificationChannelCard
							channel={channel}
							key={channel.id}
							onEdit={handleEdit}
						/>
					))}
				</div>
			)}

			<NotificationChannelDialog
				channel={selectedChannel}
				onOpenChange={handleDialogClose}
				open={dialogOpen}
			/>
		</div>
	);
}
