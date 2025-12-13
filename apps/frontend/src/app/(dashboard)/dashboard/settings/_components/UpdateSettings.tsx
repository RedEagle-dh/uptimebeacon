"use client";

import {
	ArrowUpCircle,
	CheckCircle2,
	ExternalLink,
	Loader2,
	RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { UpdateInstructions } from "@/components/shared/UpdateInstructions";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { api } from "@/trpc/react";

export function UpdateSettings() {
	const [showInstructions, setShowInstructions] = useState(false);

	const {
		data: status,
		isLoading: statusLoading,
		refetch: refetchStatus,
	} = api.update.getStatus.useQuery();

	const { data: settings, isLoading: settingsLoading } =
		api.update.getSettings.useQuery();

	const checkNowMutation = api.update.checkNow.useMutation({
		onSuccess: () => {
			refetchStatus();
		},
	});

	const updateSettingsMutation = api.update.updateSettings.useMutation();

	const handleAutoCheckChange = (checked: boolean) => {
		updateSettingsMutation.mutate({ autoCheck: checked });
	};

	const handleIntervalChange = (value: string) => {
		updateSettingsMutation.mutate({
			checkIntervalSeconds: Number.parseInt(value, 10),
		});
	};

	const isLoading = statusLoading || settingsLoading;

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>System Updates</CardTitle>
					<CardDescription>Check for and manage updates</CardDescription>
				</CardHeader>
				<CardContent className="flex items-center justify-center py-8">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>System Updates</CardTitle>
					<CardDescription>
						Check for and manage UptimeBeacon updates
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Version Status */}
					<div className="rounded-lg border border-border/40 bg-card/50 p-4">
						<div className="flex items-start justify-between">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									{status?.updateAvailable ? (
										<ArrowUpCircle className="h-5 w-5 text-yellow-500" />
									) : (
										<CheckCircle2 className="h-5 w-5 text-green-500" />
									)}
									<span className="font-medium">
										{status?.updateAvailable
											? "Update Available"
											: "Up to Date"}
									</span>
								</div>
								<div className="text-muted-foreground text-sm">
									<p>
										Current version:{" "}
										<span className="font-mono">{status?.currentVersion}</span>
									</p>
									{status?.latestVersion && (
										<p>
											Latest version:{" "}
											<span className="font-mono">{status?.latestVersion}</span>
											{status?.updateType && (
												<span className="ml-2 text-xs text-yellow-500">
													({status.updateType} update)
												</span>
											)}
										</p>
									)}
									{status?.lastCheckedAt && (
										<p className="mt-1 text-xs">
											Last checked:{" "}
											{new Date(status.lastCheckedAt).toLocaleString()}
										</p>
									)}
								</div>
							</div>
							<div className="flex gap-2">
								<Button
									disabled={checkNowMutation.isPending}
									onClick={() => checkNowMutation.mutate()}
									size="sm"
									variant="outline"
								>
									{checkNowMutation.isPending ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<RefreshCw className="mr-2 h-4 w-4" />
									)}
									Check Now
								</Button>
								{status?.updateAvailable && (
									<Button onClick={() => setShowInstructions(true)} size="sm">
										How to Update
									</Button>
								)}
							</div>
						</div>
						{status?.releaseUrl && status?.updateAvailable && (
							<div className="mt-3 border-border/40 border-t pt-3">
								<a
									className="inline-flex items-center gap-1 text-blue-400 text-sm hover:text-blue-300"
									href={status.releaseUrl}
									rel="noopener noreferrer"
									target="_blank"
								>
									<ExternalLink className="h-4 w-4" />
									View release notes
								</a>
							</div>
						)}
					</div>

					<Separator />

					{/* Update Settings */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<Label className="font-medium" htmlFor="auto-check">
									Automatic Update Checks
								</Label>
								<p className="text-muted-foreground text-sm">
									Periodically check for new versions
								</p>
							</div>
							<Switch
								checked={settings?.autoCheck ?? true}
								disabled={updateSettingsMutation.isPending}
								id="auto-check"
								onCheckedChange={handleAutoCheckChange}
							/>
						</div>

						{settings?.autoCheck && (
							<div className="flex items-center justify-between">
								<div>
									<Label className="font-medium" htmlFor="check-interval">
										Check Interval
									</Label>
									<p className="text-muted-foreground text-sm">
										How often to check for updates
									</p>
								</div>
								<Select
									disabled={updateSettingsMutation.isPending}
									onValueChange={(value) =>
										value && handleIntervalChange(value)
									}
									value={String(settings?.checkIntervalSeconds ?? 21600)}
								>
									<SelectTrigger className="w-32">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="3600">1 hour</SelectItem>
										<SelectItem value="21600">6 hours</SelectItem>
										<SelectItem value="43200">12 hours</SelectItem>
										<SelectItem value="86400">24 hours</SelectItem>
									</SelectContent>
								</Select>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<UpdateInstructions
				currentVersion={status?.currentVersion ?? "0.1.0"}
				latestVersion={status?.latestVersion ?? null}
				onOpenChange={setShowInstructions}
				open={showInstructions}
				releaseUrl={status?.releaseUrl ?? null}
			/>
		</>
	);
}
