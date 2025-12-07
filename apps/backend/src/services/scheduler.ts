import { db, type Monitor } from "@uptimebeacon/database";
import { logger } from "../utils/logger";
import { broadcastUpdate } from "../websocket";
import { runCheck } from "./checker";
import { handleStatusChange } from "./incident";

// Store active check intervals
const activeChecks = new Map<string, Timer>();

export async function initScheduler(): Promise<void> {
	logger.info("Initializing monitoring scheduler...");

	// Load all active monitors
	const monitors = await db.monitor.findMany({
		where: {
			active: true,
			paused: false,
		},
	});

	logger.info(`Found ${monitors.length} active monitors`);

	// Schedule each monitor
	for (const monitor of monitors) {
		scheduleMonitor(monitor);
	}
}

export function scheduleMonitor(monitor: Monitor): void {
	// Clear existing interval if any
	const existing = activeChecks.get(monitor.id);
	if (existing) {
		clearInterval(existing);
	}

	// Run initial check after a short delay
	setTimeout(() => executeCheck(monitor.id), 1000);

	// Schedule recurring checks
	const interval = setInterval(
		() => executeCheck(monitor.id),
		monitor.interval * 1000,
	);

	activeChecks.set(monitor.id, interval);
	logger.info(
		`Scheduled monitor: ${monitor.name} (every ${monitor.interval}s)`,
	);
}

export function unscheduleMonitor(monitorId: string): void {
	const interval = activeChecks.get(monitorId);
	if (interval) {
		clearInterval(interval);
		activeChecks.delete(monitorId);
		logger.info(`Unscheduled monitor: ${monitorId}`);
	}
}

export function getActiveMonitorCount(): number {
	return activeChecks.size;
}

async function executeCheck(monitorId: string): Promise<void> {
	try {
		const monitor = await db.monitor.findUnique({
			where: { id: monitorId },
			include: { notifications: { include: { channel: true } } },
		});

		if (!monitor || !monitor.active || monitor.paused) {
			unscheduleMonitor(monitorId);
			return;
		}

		logger.debug(`Running check for monitor: ${monitor.name}`);

		const result = await runCheck(monitor);

		// Store check result
		const check = await db.monitorCheck.create({
			data: {
				monitorId: monitor.id,
				status: result.status,
				responseTime: result.responseTime,
				statusCode: result.statusCode,
				message: result.message,
				error: result.error,
				tlsValid: result.tlsValid,
				tlsExpiry: result.tlsExpiry,
				tlsIssuer: result.tlsIssuer,
				dnsResolvedIp: result.dnsResolvedIp,
			},
		});

		// Calculate new uptime percentage and average response time using database aggregation
		const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

		// Use parallel queries for better performance
		const [totalCount, upCount, avgResult] = await Promise.all([
			db.monitorCheck.count({
				where: {
					monitorId: monitor.id,
					createdAt: { gte: oneDayAgo },
				},
			}),
			db.monitorCheck.count({
				where: {
					monitorId: monitor.id,
					createdAt: { gte: oneDayAgo },
					status: "UP",
				},
			}),
			db.monitorCheck.aggregate({
				where: {
					monitorId: monitor.id,
					createdAt: { gte: oneDayAgo },
					responseTime: { not: null },
				},
				_avg: { responseTime: true },
			}),
		]);

		const uptimePercentage = totalCount > 0 ? (upCount / totalCount) * 100 : 0;
		const avgResponseTime = avgResult._avg.responseTime ?? 0;

		// Update monitor status
		const previousStatus = monitor.status;
		await db.monitor.update({
			where: { id: monitor.id },
			data: {
				status: result.status,
				lastCheckAt: new Date(),
				lastUpAt: result.status === "UP" ? new Date() : monitor.lastUpAt,
				lastDownAt: result.status === "DOWN" ? new Date() : monitor.lastDownAt,
				uptimePercentage,
				avgResponseTime,
			},
		});

		// Handle status change (incidents, notifications)
		if (previousStatus !== result.status) {
			await handleStatusChange(monitor, previousStatus, result.status);
		}

		// Broadcast real-time update via WebSocket
		broadcastUpdate({
			type: "check",
			monitorId: monitor.id,
			check: {
				id: check.id,
				status: result.status,
				responseTime: result.responseTime,
				createdAt: check.createdAt.toISOString(),
			},
		});

		logger.debug(
			`Check completed for ${monitor.name}: ${result.status} (${result.responseTime}ms)`,
		);
	} catch (error) {
		logger.error(`Error checking monitor ${monitorId}:`, error);
	}
}
