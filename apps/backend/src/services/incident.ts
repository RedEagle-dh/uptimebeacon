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
		// Resolve existing incidents
		const openIncidents = await db.incident.findMany({
			where: {
				monitorId: monitor.id,
				resolvedAt: null,
			},
		});

		for (const incident of openIncidents) {
			const duration = Math.floor(
				(Date.now() - incident.startedAt.getTime()) / 1000,
			);

			await db.incident.update({
				where: { id: incident.id },
				data: {
					status: "resolved",
					resolvedAt: new Date(),
					duration,
				},
			});

			// Add resolution update
			await db.incidentUpdate.create({
				data: {
					incidentId: incident.id,
					status: "resolved",
					message: `Monitor ${monitor.name} is back online after ${formatDuration(duration)}`,
				},
			});

			logger.info(
				`Resolved incident ${incident.id} for monitor ${monitor.name}`,
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
