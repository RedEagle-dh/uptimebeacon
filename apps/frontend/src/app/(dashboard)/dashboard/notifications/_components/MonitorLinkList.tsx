"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";

export interface MonitorLinkConfig {
	monitorId: string;
	linked: boolean;
	// Status change notifications
	notifyOnDown: boolean;
	notifyOnUp: boolean;
	notifyOnDegraded: boolean;
	// Operational event notifications
	notifyOnSslExpiry: boolean;
	notifyOnMaintenance: boolean;
	notifyOnFirstCheck: boolean;
	notifyOnPauseResume: boolean;
}

interface MonitorLinkListProps {
	monitorLinks: MonitorLinkConfig[];
	onLinkChange: (
		monitorId: string,
		field: keyof Omit<MonitorLinkConfig, "monitorId">,
		value: boolean,
	) => void;
	idPrefix?: string;
}

export function MonitorLinkList({
	monitorLinks,
	onLinkChange,
	idPrefix = "",
}: MonitorLinkListProps) {
	const { data: monitors, isLoading } = api.monitor.getAll.useQuery();

	const getLinkConfig = (monitorId: string): MonitorLinkConfig => {
		return (
			monitorLinks.find((link) => link.monitorId === monitorId) || {
				monitorId,
				linked: false,
				notifyOnDown: true,
				notifyOnUp: true,
				notifyOnDegraded: false,
				notifyOnSslExpiry: true,
				notifyOnMaintenance: true,
				notifyOnFirstCheck: false,
				notifyOnPauseResume: false,
			}
		);
	};

	return (
		<div className="space-y-3">
			<Label>Link Monitors</Label>
			<p className="text-muted-foreground text-sm">
				Select which monitors should send notifications to this channel
			</p>

			{isLoading ? (
				<p className="text-muted-foreground text-sm">Loading monitors...</p>
			) : monitors && monitors.length > 0 ? (
				<div className="max-h-[200px] space-y-2 overflow-y-auto rounded-md border p-3">
					{monitors.map((monitor) => {
						const linkConfig = getLinkConfig(monitor.id);
						const checkboxId = `${idPrefix}monitor-${monitor.id}`;
						return (
							<div
								className="flex flex-col gap-2 rounded-md p-2 hover:bg-muted/50"
								key={monitor.id}
							>
								<div className="flex items-center gap-2">
									<Checkbox
										checked={linkConfig.linked}
										id={checkboxId}
										onCheckedChange={(checked) =>
											onLinkChange(monitor.id, "linked", checked === true)
										}
									/>
									<Label className="flex-1 cursor-pointer" htmlFor={checkboxId}>
										{monitor.name}
									</Label>
								</div>
								{linkConfig.linked && (
									<div className="ml-6 space-y-2 text-sm">
										{/* Status Change Events */}
										<div>
											<p className="mb-1 font-medium text-muted-foreground text-xs">
												Status Changes
											</p>
											<div className="flex flex-wrap gap-3">
												<Label className="flex cursor-pointer items-center gap-1.5 font-normal">
													<Checkbox
														checked={linkConfig.notifyOnDown}
														onCheckedChange={(checked) =>
															onLinkChange(
																monitor.id,
																"notifyOnDown",
																checked === true,
															)
														}
													/>
													<span className="text-muted-foreground">Down</span>
												</Label>
												<Label className="flex cursor-pointer items-center gap-1.5 font-normal">
													<Checkbox
														checked={linkConfig.notifyOnUp}
														onCheckedChange={(checked) =>
															onLinkChange(
																monitor.id,
																"notifyOnUp",
																checked === true,
															)
														}
													/>
													<span className="text-muted-foreground">Up</span>
												</Label>
												<Label className="flex cursor-pointer items-center gap-1.5 font-normal">
													<Checkbox
														checked={linkConfig.notifyOnDegraded}
														onCheckedChange={(checked) =>
															onLinkChange(
																monitor.id,
																"notifyOnDegraded",
																checked === true,
															)
														}
													/>
													<span className="text-muted-foreground">
														Degraded
													</span>
												</Label>
											</div>
										</div>
										{/* Operational Events */}
										<div>
											<p className="mb-1 font-medium text-muted-foreground text-xs">
												Operational Events
											</p>
											<div className="flex flex-wrap gap-3">
												<Label className="flex cursor-pointer items-center gap-1.5 font-normal">
													<Checkbox
														checked={linkConfig.notifyOnSslExpiry}
														onCheckedChange={(checked) =>
															onLinkChange(
																monitor.id,
																"notifyOnSslExpiry",
																checked === true,
															)
														}
													/>
													<span className="text-muted-foreground">
														SSL Expiry
													</span>
												</Label>
												<Label className="flex cursor-pointer items-center gap-1.5 font-normal">
													<Checkbox
														checked={linkConfig.notifyOnMaintenance}
														onCheckedChange={(checked) =>
															onLinkChange(
																monitor.id,
																"notifyOnMaintenance",
																checked === true,
															)
														}
													/>
													<span className="text-muted-foreground">
														Maintenance
													</span>
												</Label>
												<Label className="flex cursor-pointer items-center gap-1.5 font-normal">
													<Checkbox
														checked={linkConfig.notifyOnFirstCheck}
														onCheckedChange={(checked) =>
															onLinkChange(
																monitor.id,
																"notifyOnFirstCheck",
																checked === true,
															)
														}
													/>
													<span className="text-muted-foreground">
														First Check
													</span>
												</Label>
												<Label className="flex cursor-pointer items-center gap-1.5 font-normal">
													<Checkbox
														checked={linkConfig.notifyOnPauseResume}
														onCheckedChange={(checked) =>
															onLinkChange(
																monitor.id,
																"notifyOnPauseResume",
																checked === true,
															)
														}
													/>
													<span className="text-muted-foreground">
														Pause/Resume
													</span>
												</Label>
											</div>
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			) : (
				<p className="text-muted-foreground text-sm">
					No monitors found. Create monitors first to link them.
				</p>
			)}
		</div>
	);
}
