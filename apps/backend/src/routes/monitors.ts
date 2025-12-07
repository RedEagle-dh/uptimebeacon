import { db } from "@uptimebeacon/database";
import { Elysia, t } from "elysia";
import { runCheck } from "../services/checker";
import { scheduleMonitor, unscheduleMonitor } from "../services/scheduler";
import { broadcastUpdate } from "../websocket";

export const monitorRoutes = new Elysia({ prefix: "/api/monitors" })
	// Get all monitors for a user
	.get(
		"/",
		async ({ query }) => {
			const monitors = await db.monitor.findMany({
				where: query.userId ? { userId: query.userId } : undefined,
				include: {
					_count: {
						select: { checks: true, incidents: true },
					},
				},
				orderBy: { createdAt: "desc" },
			});

			return monitors;
		},
		{
			query: t.Object({
				userId: t.Optional(t.String()),
			}),
		},
	)

	// Get single monitor with recent checks
	.get(
		"/:id",
		async ({ params }) => {
			const monitor = await db.monitor.findUnique({
				where: { id: params.id },
				include: {
					checks: {
						take: 100,
						orderBy: { createdAt: "desc" },
					},
					incidents: {
						where: { resolvedAt: null },
						orderBy: { startedAt: "desc" },
					},
				},
			});

			if (!monitor) {
				return { error: "Monitor not found" };
			}

			return monitor;
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)

	// Get monitor checks history
	.get(
		"/:id/checks",
		async ({ params, query }) => {
			// Cap limit to prevent excessive data loading (max 500)
			const limit = Math.min(Math.max(1, query.limit ?? 100), 500);
			const offset = Math.max(0, query.offset ?? 0);

			const checks = await db.monitorCheck.findMany({
				where: { monitorId: params.id },
				take: limit,
				skip: offset,
				orderBy: { createdAt: "desc" },
			});

			return checks;
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			query: t.Object({
				limit: t.Optional(t.Number()),
				offset: t.Optional(t.Number()),
			}),
		},
	)

	// Trigger immediate check
	.post(
		"/:id/check",
		async ({ params }) => {
			const monitor = await db.monitor.findUnique({
				where: { id: params.id },
			});

			if (!monitor) {
				return { error: "Monitor not found" };
			}

			// Run check immediately
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
				},
			});

			// Update monitor status
			await db.monitor.update({
				where: { id: monitor.id },
				data: {
					status: result.status,
					lastCheckAt: new Date(),
				},
			});

			// Broadcast update
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

			return { success: true, result };
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)

	// Pause monitor
	.post(
		"/:id/pause",
		async ({ params }) => {
			const monitor = await db.monitor.update({
				where: { id: params.id },
				data: { paused: true },
			});

			unscheduleMonitor(params.id);

			broadcastUpdate({
				type: "monitor",
				monitorId: params.id,
				action: "paused",
			});

			return monitor;
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)

	// Resume monitor
	.post(
		"/:id/resume",
		async ({ params }) => {
			const monitor = await db.monitor.update({
				where: { id: params.id },
				data: { paused: false },
			});

			scheduleMonitor(monitor);

			broadcastUpdate({
				type: "monitor",
				monitorId: params.id,
				action: "resumed",
			});

			return monitor;
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	);
