import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const monitorCreateSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	type: z.enum([
		"HTTP",
		"HTTPS",
		"TCP",
		"PING",
		"DNS",
		"KEYWORD",
		"JSON_QUERY",
	]),
	url: z.string().url().optional(),
	hostname: z.string().optional(),
	port: z.number().int().positive().optional(),
	method: z
		.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
		.default("GET"),
	interval: z.number().int().min(30).max(3600).default(60),
	timeout: z.number().int().min(1).max(120).default(30),
	retries: z.number().int().min(0).max(10).default(3),
	retryInterval: z.number().int().min(10).max(300).default(60),
	expectedStatusCodes: z.array(z.number().int()).default([200, 201, 204]),
	headers: z.record(z.string(), z.string()).optional(),
	body: z.string().optional(),
	keyword: z.string().optional(),
	keywordType: z.enum(["present", "absent"]).optional(),
	jsonPath: z.string().optional(),
	expectedValue: z.string().optional(),
	ignoreTls: z.boolean().default(false),
	tlsExpiry: z.boolean().default(true),
	tlsExpiryDays: z.number().int().min(1).max(90).default(7),
	authMethod: z.enum(["none", "basic", "bearer"]).optional(),
	authUser: z.string().optional(),
	authPass: z.string().optional(),
	authToken: z.string().optional(),
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
					headers: input.headers
						? JSON.parse(JSON.stringify(input.headers))
						: undefined,
					userId: ctx.session.user.id,
				},
			});

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
					headers: input.data.headers
						? JSON.parse(JSON.stringify(input.data.headers))
						: undefined,
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
});
