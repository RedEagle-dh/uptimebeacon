"use client";

import { AlertTriangle, CheckCircle, Clock, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, type RouterOutputs } from "@/trpc/react";

type Incident = RouterOutputs["incident"]["getAll"][number];

function formatDate(date: Date) {
	return new Date(date).toLocaleString();
}

function IncidentCard({ incident }: { incident: Incident }) {
	const severityColors = {
		minor: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
		major: "bg-orange-500/10 text-orange-500 border-orange-500/20",
		critical: "bg-red-500/10 text-red-500 border-red-500/20",
	};

	const statusColors = {
		investigating: "bg-yellow-500",
		identified: "bg-orange-500",
		monitoring: "bg-blue-500",
		resolved: "bg-green-500",
	};

	return (
		<Card>
			<CardContent className="p-6">
				<div className="flex items-start justify-between">
					<div className="flex items-start gap-4">
						{incident.status === "resolved" ? (
							<CheckCircle className="mt-0.5 size-5 text-green-500" />
						) : (
							<AlertTriangle className="mt-0.5 size-5 text-yellow-500" />
						)}
						<div>
							<h3 className="font-semibold">{incident.title}</h3>
							<p className="text-muted-foreground text-sm">
								{incident.monitor.name}
							</p>
							<div className="mt-2 flex items-center gap-2">
								<Badge
									className={
										severityColors[
											incident.severity as keyof typeof severityColors
										]
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

					<div className="flex items-center gap-2">
						<span
							className={`size-2 rounded-full ${statusColors[incident.status as keyof typeof statusColors]}`}
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
	);
}

export function IncidentsClient() {
	const [incidents] = api.incident.getAll.useSuspenseQuery();

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
				<Button>
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

				<TabsContent className="space-y-4" value="active">
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
						activeIncidents.map((incident) => (
							<IncidentCard incident={incident} key={incident.id} />
						))
					)}
				</TabsContent>

				<TabsContent className="space-y-4" value="resolved">
					{resolvedIncidents.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<p className="text-muted-foreground">No resolved incidents</p>
							</CardContent>
						</Card>
					) : (
						resolvedIncidents.map((incident) => (
							<IncidentCard incident={incident} key={incident.id} />
						))
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
