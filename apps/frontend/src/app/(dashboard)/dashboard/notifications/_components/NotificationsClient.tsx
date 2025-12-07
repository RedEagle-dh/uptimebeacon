"use client";

import { Bell, Mail, MessageSquare, Plus, Webhook } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CHANNEL_COLORS } from "@/lib/constants";
import { api, type RouterOutputs } from "@/trpc/react";

type NotificationChannel = RouterOutputs["notification"]["getAll"][number];

const channelIcons = {
	DISCORD: MessageSquare,
	SLACK: MessageSquare,
	EMAIL: Mail,
	WEBHOOK: Webhook,
	TELEGRAM: MessageSquare,
};

function ChannelCard({ channel }: { channel: NotificationChannel }) {
	const utils = api.useUtils();
	const updateMutation = api.notification.update.useMutation({
		onSuccess: () => {
			utils.notification.getAll.invalidate();
		},
	});

	const Icon = channelIcons[channel.type as keyof typeof channelIcons] ?? Bell;
	const channelColor =
		CHANNEL_COLORS[channel.type as keyof typeof CHANNEL_COLORS];
	const colorClass = channelColor
		? `${channelColor.bgClass} ${channelColor.textClass}`
		: "bg-muted text-muted-foreground";
	const monitorsCount = channel._count.monitors;

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="flex items-center gap-3 font-medium text-base">
					<div className={`rounded-lg p-2 ${colorClass}`}>
						<Icon className="size-4" />
					</div>
					{channel.name}
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
					<Button size="sm" variant="ghost">
						Configure
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

export function NotificationsClient() {
	const [channels] = api.notification.getAll.useSuspenseQuery();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Notifications</h1>
					<p className="text-muted-foreground">
						Configure how you receive alerts
					</p>
				</div>
				<Button>
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
						<Button>
							<Plus className="mr-2 size-4" />
							Add your first channel
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2">
					{channels.map((channel) => (
						<ChannelCard channel={channel} key={channel.id} />
					))}
				</div>
			)}

			{/* Notification Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Notification Settings</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Down Alerts</p>
							<p className="text-muted-foreground text-sm">
								Get notified when a service goes down
							</p>
						</div>
						<Switch defaultChecked />
					</div>
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Recovery Alerts</p>
							<p className="text-muted-foreground text-sm">
								Get notified when a service recovers
							</p>
						</div>
						<Switch defaultChecked />
					</div>
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Degraded Performance</p>
							<p className="text-muted-foreground text-sm">
								Get notified when response time exceeds threshold
							</p>
						</div>
						<Switch />
					</div>
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">SSL Certificate Expiry</p>
							<p className="text-muted-foreground text-sm">
								Get notified before SSL certificates expire
							</p>
						</div>
						<Switch defaultChecked />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
