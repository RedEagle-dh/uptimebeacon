"use client";

import { AlertTriangle, CheckCircle, Clock, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { INCIDENT_STATUS_CONFIG, SEVERITY_CONFIG } from "@/lib/constants";
import { api, type RouterOutputs } from "@/trpc/react";

import { CreateIncidentDialog } from "./CreateIncidentDialog";

type Incident = RouterOutputs["incident"]["getAll"][number];

function formatDate(date: Date) {
	return new Date(date).toLocaleString();
}

function IncidentCard({ incident }: { incident: Incident }) {
	return (
		<Link className="block" href={`/dashboard/incidents/${incident.id}`}>
			<Card className="cursor-pointer transition-colors hover:bg-muted/50">
				<CardContent className="p-6">
					<div className="flex items-start justify-between gap-4">
						<div className="flex min-w-0 flex-1 items-start gap-4">
							{incident.status === "resolved" ? (
								<CheckCircle className="mt-0.5 size-5 shrink-0 text-green-500" />
							) : (
								<AlertTriangle className="mt-0.5 size-5 shrink-0 text-yellow-500" />
							)}
							<div className="min-w-0">
								<h3 className="truncate font-semibold">{incident.title}</h3>
								<p className="text-muted-foreground text-sm">
									{incident.monitor.name}
								</p>
								<div className="mt-2 flex items-center gap-2">
									<Badge
										className={
											SEVERITY_CONFIG[
												incident.severity as keyof typeof SEVERITY_CONFIG
											]?.badgeClass
										}
										variant="outline"
									>
										{incident.severity}
									</Badge>
									<span className="flex items-center gap-1 text-muted-foreground text-xs">
										<Clock className="size-3" />
										Started {formatDate(incident.startedAt)}
									</span>
								</div>
							</div>
						</div>

						<div className="flex shrink-0 items-center gap-2">
							<span
								className={`size-2 rounded-full ${INCIDENT_STATUS_CONFIG[incident.status as keyof typeof INCIDENT_STATUS_CONFIG]?.dotClass}`}
							/>
							<span className="font-medium text-sm capitalize">
								{incident.status}
							</span>
						</div>
					</div>

					{incident.updates.length > 0 && (
						<div className="mt-4 border-border border-l-2 pl-4">
							{incident.updates.slice(0, 2).map((update) => (
								<div className="mb-2 last:mb-0" key={update.id}>
									<p className="text-sm">{update.message}</p>
									<p className="text-muted-foreground text-xs">
										{formatDate(update.createdAt)}
									</p>
								</div>
							))}
							{incident.updates.length > 2 && (
								<p className="text-muted-foreground text-xs">
									+{incident.updates.length - 2} more updates
								</p>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</Link>
	);
}

export function IncidentsClient() {
	const [incidents] = api.incident.getAll.useSuspenseQuery();
	const [createDialogOpen, setCreateDialogOpen] = useState(false);

	const activeIncidents = incidents.filter((i) => i.status !== "resolved");
	const resolvedIncidents = incidents.filter((i) => i.status === "resolved");

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Incidents</h1>
					<p className="text-muted-foreground">
						Track and manage service incidents
					</p>
				</div>
				<Button onClick={() => setCreateDialogOpen(true)}>
					<Plus className="mr-2 size-4" />
					Report Incident
				</Button>
			</div>

			<Tabs className="space-y-4" defaultValue="active">
				<TabsList>
					<TabsTrigger value="active">
						Active ({activeIncidents.length})
					</TabsTrigger>
					<TabsTrigger value="resolved">
						Resolved ({resolvedIncidents.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="active">
					{activeIncidents.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<CheckCircle className="mb-4 size-12 text-green-500" />
								<p className="font-medium">No active incidents</p>
								<p className="text-muted-foreground text-sm">
									All systems are operational
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{activeIncidents.map((incident) => (
								<IncidentCard incident={incident} key={incident.id} />
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="resolved">
					{resolvedIncidents.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<p className="text-muted-foreground">No resolved incidents</p>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{resolvedIncidents.map((incident) => (
								<IncidentCard incident={incident} key={incident.id} />
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>

			<CreateIncidentDialog
				onOpenChange={setCreateDialogOpen}
				open={createDialogOpen}
			/>
		</div>
	);
}
