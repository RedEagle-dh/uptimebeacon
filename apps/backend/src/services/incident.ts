import { db, type Monitor, type MonitorStatus } from "@uptimebeacon/database";
import { logger } from "../utils/logger";
import { sendNotifications } from "./notification";

export async function handleStatusChange(
	monitor: Monitor & { notifications?: { channel: { id: string } }[] },
	previousStatus: MonitorStatus,
	newStatus: MonitorStatus,
): Promise<void> {
	logger.info(
		`Monitor ${monitor.name} status changed: ${previousStatus} -> ${newStatus}`,
	);

	// Create or resolve incident based on status change
	if (newStatus === "DOWN" && previousStatus !== "DOWN") {
		// Create new incident
		const incident = await db.incident.create({
			data: {
				monitorId: monitor.id,
				title: `${monitor.name} is down`,
				description: `Monitor ${monitor.name} became unavailable`,
				status: "investigating",
				severity: "major",
			},
		});

		logger.info(`Created incident ${incident.id} for monitor ${monitor.name}`);

		// Send notifications
		await sendNotifications(monitor, "down", incident);
	} else if (newStatus === "UP" && previousStatus === "DOWN") {
		// Resolve existing incidents using batch operations for better performance
		const openIncidents = await db.incident.findMany({
			where: {
				monitorId: monitor.id,
				resolvedAt: null,
			},
			select: { id: true, startedAt: true },
		});

		if (openIncidents.length > 0) {
			const now = new Date();
			const incidentIds = openIncidents.map((i) => i.id);

			// Batch update all incidents
			await db.incident.updateMany({
				where: { id: { in: incidentIds } },
				data: {
					status: "resolved",
					resolvedAt: now,
				},
			});

			// Update duration for each incident (needs individual updates due to calculated field)
			// and create incident updates in batch
			const incidentUpdates = openIncidents.map((incident) => {
				const duration = Math.floor(
					(now.getTime() - incident.startedAt.getTime()) / 1000,
				);
				return {
					incidentId: incident.id,
					status: "resolved",
					message: `Monitor ${monitor.name} is back online after ${formatDuration(duration)}`,
				};
			});

			// Batch create all incident updates
			await db.incidentUpdate.createMany({
				data: incidentUpdates,
			});

			// Update individual durations (needed since duration varies per incident)
			await Promise.all(
				openIncidents.map((incident) => {
					const duration = Math.floor(
						(now.getTime() - incident.startedAt.getTime()) / 1000,
					);
					return db.incident.update({
						where: { id: incident.id },
						data: { duration },
					});
				}),
			);

			logger.info(
				`Resolved ${openIncidents.length} incident(s) for monitor ${monitor.name}`,
			);
		}

		// Send recovery notifications
		await sendNotifications(monitor, "up");
	} else if (newStatus === "DEGRADED") {
		// Handle degraded state
		await sendNotifications(monitor, "degraded");
	}
}

function formatDuration(seconds: number): string {
	if (seconds < 60) return `${seconds} seconds`;
	if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
	if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
	return `${Math.floor(seconds / 86400)} days`;
}
