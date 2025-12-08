import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "@/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

// Helper to call backend scheduler
async function notifyBackendScheduler(
	monitorId: string,
	action: "schedule" | "unschedule",
): Promise<void> {
	const backendUrl = env.BACKEND_URL ?? "http://localhost:3001";
	try {
		await fetch(`${backendUrl}/api/monitors/${monitorId}/${action}`, {
			method: "POST",
		});
	} catch (error) {
		console.error(`Failed to ${action} monitor in backend:`, error);
		// Don't throw - the monitor is already saved, scheduler will pick it up on restart
	}
}

// Helper to call backend pause/resume (which also handles notifications)
async function notifyBackendPauseResume(
	monitorId: string,
	action: "pause" | "resume",
): Promise<void> {
	const backendUrl = env.BACKEND_URL ?? "http://localhost:3001";
	try {
		await fetch(`${backendUrl}/api/monitors/${monitorId}/${action}`, {
			method: "POST",
		});
	} catch (error) {
		console.error(`Failed to ${action} monitor in backend:`, error);
	}
}

const monitorCreateSchema = z.object({
	name: z.string().min(1, "Name is required").max(255, "Name is too long"),
	description: z.string().max(1000, "Description is too long").optional(),
	type: z.enum([
		"HTTP",
		"HTTPS",
		"TCP",
		"PING",
		"DNS",
		"KEYWORD",
		"JSON_QUERY",
	]),
	url: z.string().url().max(2048, "URL is too long").optional(),
	hostname: z.string().max(253, "Hostname is too long").optional(),
	port: z.number().int().min(1).max(65535).optional(),
	method: z
		.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
		.default("GET"),
	interval: z.number().int().min(30).max(3600).default(60),
	timeout: z.number().int().min(1).max(120).default(30),
	retries: z.number().int().min(0).max(10).default(3),
	retryInterval: z.number().int().min(10).max(300).default(60),
	expectedStatusCodes: z
		.array(z.number().int().min(100).max(599))
		.max(20)
		.default([200, 201, 204]),
	headers: z.record(z.string().max(256), z.string().max(4096)).optional(),
	body: z.string().max(65536, "Request body is too large").optional(),
	keyword: z.string().max(1000, "Keyword is too long").optional(),
	keywordType: z.enum(["present", "absent"]).optional(),
	jsonPath: z.string().max(500, "JSON path is too long").optional(),
	expectedValue: z.string().max(1000, "Expected value is too long").optional(),
	ignoreTls: z.boolean().default(false),
	tlsExpiry: z.boolean().default(true),
	tlsExpiryDays: z.number().int().min(1).max(90).default(7),
	authMethod: z.enum(["none", "basic", "bearer"]).optional(),
	authUser: z.string().max(256, "Auth user is too long").optional(),
	authPass: z.string().max(256, "Auth password is too long").optional(),
	authToken: z.string().max(4096, "Auth token is too long").optional(),
});

const monitorUpdateSchema = monitorCreateSchema.partial().extend({
	active: z.boolean().optional(),
	paused: z.boolean().optional(),
});

export const monitorRouter = createTRPCRouter({
	getAll: protectedProcedure
		.input(
			z
				.object({
					status: z
						.enum(["UP", "DOWN", "DEGRADED", "MAINTENANCE", "PENDING"])
						.optional(),
					search: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const where = {
				userId: ctx.session.user.id,
				...(input?.status && { status: input.status }),
				...(input?.search && {
					OR: [
						{ name: { contains: input.search, mode: "insensitive" as const } },
						{ url: { contains: input.search, mode: "insensitive" as const } },
					],
				}),
			};

			const monitors = await ctx.db.monitor.findMany({
				where,
				orderBy: { createdAt: "desc" },
				include: {
					_count: {
						select: { checks: true, incidents: true },
					},
				},
			});

			return monitors;
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const monitor = await ctx.db.monitor.findFirst({
				where: {
					id: input.id,
					userId: ctx.session.user.id,
				},
				include: {
					checks: {
						orderBy: { createdAt: "desc" },
						take: 100,
					},
					incidents: {
						orderBy: { startedAt: "desc" },
						take: 10,
						include: {
							updates: {
								orderBy: { createdAt: "desc" },
								take: 5,
							},
						},
					},
				},
			});

			if (!monitor) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Monitor not found",
				});
			}

			return monitor;
		}),

	create: protectedProcedure
		.input(monitorCreateSchema)
		.mutation(async ({ ctx, input }) => {
			const monitor = await ctx.db.monitor.create({
				data: {
					...input,
					// Prisma handles JSON serialization automatically, no need for parse/stringify
					headers: input.headers ?? undefined,
					userId: ctx.session.user.id,
				},
			});

			// Notify backend to schedule the monitor
			await notifyBackendScheduler(monitor.id, "schedule");

			return monitor;
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				data: monitorUpdateSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.monitor.findFirst({
				where: {
					id: input.id,
					userId: ctx.session.user.id,
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Monitor not found",
				});
			}

			const monitor = await ctx.db.monitor.update({
				where: { id: input.id },
				data: {
					...input.data,
					// Prisma handles JSON serialization automatically, no need for parse/stringify
					headers: input.data.headers ?? undefined,
				},
			});

			return monitor;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.monitor.findFirst({
				where: {
					id: input.id,
					userId: ctx.session.user.id,
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Monitor not found",
				});
			}

			// Unschedule the monitor in the backend first
			await notifyBackendScheduler(input.id, "unschedule");

			await ctx.db.monitor.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	pause: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.monitor.findFirst({
				where: {
					id: input.id,
					userId: ctx.session.user.id,
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Monitor not found",
				});
			}

			const monitor = await ctx.db.monitor.update({
				where: { id: input.id },
				data: { paused: true },
			});

			// Notify backend to pause (unschedule) the monitor
			await notifyBackendPauseResume(input.id, "pause");

			return monitor;
		}),

	resume: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.monitor.findFirst({
				where: {
					id: input.id,
					userId: ctx.session.user.id,
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Monitor not found",
				});
			}

			const monitor = await ctx.db.monitor.update({
				where: { id: input.id },
				data: { paused: false },
			});

			// Notify backend to resume (reschedule) the monitor
			await notifyBackendPauseResume(input.id, "resume");

			return monitor;
		}),

	getStats: protectedProcedure.query(async ({ ctx }) => {
		const monitors = await ctx.db.monitor.findMany({
			where: { userId: ctx.session.user.id },
			select: {
				status: true,
				avgResponseTime: true,
			},
		});

		const stats = {
			total: monitors.length,
			up: monitors.filter((m) => m.status === "UP").length,
			down: monitors.filter((m) => m.status === "DOWN").length,
			degraded: monitors.filter((m) => m.status === "DEGRADED").length,
			pending: monitors.filter((m) => m.status === "PENDING").length,
			maintenance: monitors.filter((m) => m.status === "MAINTENANCE").length,
			avgResponseTime:
				monitors.length > 0
					? monitors.reduce((acc, m) => acc + m.avgResponseTime, 0) /
						monitors.length
					: 0,
		};

		return stats;
	}),

	getRecentChecks: protectedProcedure
		.input(
			z.object({
				monitorId: z.string(),
				limit: z.number().int().min(1).max(1000).default(100),
			}),
		)
		.query(async ({ ctx, input }) => {
			const monitor = await ctx.db.monitor.findFirst({
				where: {
					id: input.monitorId,
					userId: ctx.session.user.id,
				},
			});

			if (!monitor) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Monitor not found",
				});
			}

			const checks = await ctx.db.monitorCheck.findMany({
				where: { monitorId: input.monitorId },
				orderBy: { createdAt: "desc" },
				take: input.limit,
			});

			return checks;
		}),

	getUptimeData: protectedProcedure
		.input(
			z.object({
				monitorId: z.string(),
				days: z.number().int().min(1).max(90).default(30),
			}),
		)
		.query(async ({ ctx, input }) => {
			const monitor = await ctx.db.monitor.findFirst({
				where: {
					id: input.monitorId,
					userId: ctx.session.user.id,
				},
			});

			if (!monitor) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Monitor not found",
				});
			}

			const startDate = new Date();
			startDate.setDate(startDate.getDate() - input.days);

			const checks = await ctx.db.monitorCheck.findMany({
				where: {
					monitorId: input.monitorId,
					createdAt: { gte: startDate },
				},
				select: {
					status: true,
					createdAt: true,
				},
				orderBy: { createdAt: "asc" },
			});

			// Group by day
			const dailyData: Record<
				string,
				{ up: number; down: number; degraded: number }
			> = {};

			for (const check of checks) {
				const day = check.createdAt.toISOString().split("T")[0]!;
				if (!dailyData[day]) {
					dailyData[day] = { up: 0, down: 0, degraded: 0 };
				}

				if (check.status === "UP") {
					dailyData[day].up++;
				} else if (check.status === "DOWN") {
					dailyData[day].down++;
				} else if (check.status === "DEGRADED") {
					dailyData[day].degraded++;
				}
			}

			return Object.entries(dailyData).map(([date, counts]) => ({
				date,
				...counts,
				uptime: (counts.up / (counts.up + counts.down + counts.degraded)) * 100,
			}));
		}),

	getDailyUptimeHistory: protectedProcedure
		.input(
			z
				.object({
					days: z.number().int().min(1).max(90).default(90),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const days = input?.days ?? 90;
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - days);
			startDate.setHours(0, 0, 0, 0);

			// Get all monitors for this user
			const monitors = await ctx.db.monitor.findMany({
				where: { userId: ctx.session.user.id },
				select: { id: true },
			});

			if (monitors.length === 0) {
				return [];
			}

			const monitorIds = monitors.map((m) => m.id);

			// Get all checks for all monitors in the date range
			const checks = await ctx.db.monitorCheck.findMany({
				where: {
					monitorId: { in: monitorIds },
					createdAt: { gte: startDate },
				},
				select: {
					status: true,
					createdAt: true,
				},
				orderBy: { createdAt: "asc" },
			});

			// Get incidents in the date range
			const incidents = await ctx.db.incident.findMany({
				where: {
					monitorId: { in: monitorIds },
					startedAt: { gte: startDate },
				},
				select: {
					startedAt: true,
					resolvedAt: true,
				},
			});

			// Group checks by day
			const dailyData: Record<
				string,
				{ up: number; down: number; degraded: number; incidents: number }
			> = {};

			// Initialize all days
			for (let i = 0; i < days; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (days - 1 - i));
				const dayKey = date.toISOString().split("T")[0]!;
				dailyData[dayKey] = { up: 0, down: 0, degraded: 0, incidents: 0 };
			}

			// Count checks per day
			for (const check of checks) {
				const day = check.createdAt.toISOString().split("T")[0]!;
				if (!dailyData[day]) continue;

				if (check.status === "UP") {
					dailyData[day].up++;
				} else if (check.status === "DOWN") {
					dailyData[day].down++;
				} else if (check.status === "DEGRADED") {
					dailyData[day].degraded++;
				}
			}

			// Count incidents per day
			for (const incident of incidents) {
				const day = incident.startedAt.toISOString().split("T")[0]!;
				if (dailyData[day]) {
					dailyData[day].incidents++;
				}
			}

			return Object.entries(dailyData)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([date, counts]) => {
					const total = counts.up + counts.down + counts.degraded;
					let status: "UP" | "DOWN" | "DEGRADED" | "PENDING" = "PENDING";

					if (total > 0) {
						if (counts.down > 0) {
							status = "DOWN";
						} else if (counts.degraded > 0) {
							status = "DEGRADED";
						} else {
							status = "UP";
						}
					}

					// Calculate downtime in minutes (rough estimate based on check ratio)
					const downtimeRatio =
						total > 0 ? (counts.down + counts.degraded * 0.5) / total : 0;
					const downtimeMinutes = Math.round(downtimeRatio * 24 * 60);

					return {
						date,
						status,
						incidents: counts.incidents,
						downtimeMinutes,
					};
				});
		}),

	getResponseTimeHistory: protectedProcedure
		.input(
			z.object({
				monitorId: z.string(),
				days: z.number().int().min(1).max(90).default(7),
			}),
		)
		.query(async ({ ctx, input }) => {
			// Verify the monitor belongs to the user
			const monitor = await ctx.db.monitor.findFirst({
				where: {
					id: input.monitorId,
					userId: ctx.session.user.id,
				},
			});

			if (!monitor) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Monitor not found",
				});
			}

			const startDate = new Date();
			startDate.setDate(startDate.getDate() - input.days);
			startDate.setHours(0, 0, 0, 0);

			// Get all checks with response times for this monitor
			const checks = await ctx.db.monitorCheck.findMany({
				where: {
					monitorId: input.monitorId,
					createdAt: { gte: startDate },
					responseTime: { not: null },
				},
				select: {
					responseTime: true,
					createdAt: true,
				},
				orderBy: { createdAt: "asc" },
			});

			// Group by day and calculate stats
			const dailyData: Record<string, { responseTimes: number[] }> = {};

			// Initialize all days
			for (let i = 0; i < input.days; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (input.days - 1 - i));
				const dayKey = date.toISOString().split("T")[0]!;
				dailyData[dayKey] = { responseTimes: [] };
			}

			// Collect response times per day
			for (const check of checks) {
				const day = check.createdAt.toISOString().split("T")[0]!;
				if (dailyData[day] && check.responseTime !== null) {
					dailyData[day].responseTimes.push(check.responseTime);
				}
			}

			return Object.entries(dailyData)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([date, { responseTimes }]) => {
					if (responseTimes.length === 0) {
						return {
							date,
							avgResponseTime: null,
							minResponseTime: null,
							maxResponseTime: null,
							checkCount: 0,
						};
					}

					const avg =
						responseTimes.reduce((sum, rt) => sum + rt, 0) /
						responseTimes.length;
					const min = Math.min(...responseTimes);
					const max = Math.max(...responseTimes);

					return {
						date,
						avgResponseTime: Math.round(avg),
						minResponseTime: min,
						maxResponseTime: max,
						checkCount: responseTimes.length,
					};
				});
		}),
});
