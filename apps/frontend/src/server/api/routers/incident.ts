import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const incidentRouter = createTRPCRouter({
	getAll: protectedProcedure
		.input(
			z
				.object({
					status: z
						.enum(["investigating", "identified", "monitoring", "resolved"])
						.optional(),
					monitorId: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const incidents = await ctx.db.incident.findMany({
				where: {
					monitor: {
						userId: ctx.session.user.id,
					},
					...(input?.status && { status: input.status }),
					...(input?.monitorId && { monitorId: input.monitorId }),
				},
				orderBy: { startedAt: "desc" },
				include: {
					monitor: {
						select: {
							id: true,
							name: true,
							url: true,
						},
					},
					updates: {
						orderBy: { createdAt: "desc" },
						take: 3,
					},
				},
			});

			return incidents;
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const incident = await ctx.db.incident.findFirst({
				where: {
					id: input.id,
					monitor: {
						userId: ctx.session.user.id,
					},
				},
				include: {
					monitor: {
						select: {
							id: true,
							name: true,
							url: true,
							status: true,
						},
					},
					updates: {
						orderBy: { createdAt: "desc" },
					},
				},
			});

			if (!incident) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Incident not found",
				});
			}

			return incident;
		}),

	create: protectedProcedure
		.input(
			z.object({
				monitorId: z.string(),
				title: z.string().min(1, "Title is required"),
				description: z.string().optional(),
				severity: z.enum(["minor", "major", "critical"]).default("minor"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
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

			const incident = await ctx.db.incident.create({
				data: {
					monitorId: input.monitorId,
					title: input.title,
					description: input.description,
					severity: input.severity,
					status: "investigating",
				},
			});

			// Create initial update
			await ctx.db.incidentUpdate.create({
				data: {
					incidentId: incident.id,
					status: "investigating",
					message: input.description ?? `Incident reported: ${input.title}`,
				},
			});

			return incident;
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().optional(),
				description: z.string().optional(),
				severity: z.enum(["minor", "major", "critical"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.incident.findFirst({
				where: {
					id: input.id,
					monitor: {
						userId: ctx.session.user.id,
					},
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Incident not found",
				});
			}

			const incident = await ctx.db.incident.update({
				where: { id: input.id },
				data: {
					title: input.title,
					description: input.description,
					severity: input.severity,
				},
			});

			return incident;
		}),

	updateStatus: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum([
					"investigating",
					"identified",
					"monitoring",
					"resolved",
				]),
				message: z.string().min(1, "Update message is required"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.incident.findFirst({
				where: {
					id: input.id,
					monitor: {
						userId: ctx.session.user.id,
					},
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Incident not found",
				});
			}

			// Update incident status
			const incident = await ctx.db.incident.update({
				where: { id: input.id },
				data: {
					status: input.status,
					...(input.status === "resolved" && {
						resolvedAt: new Date(),
						duration: Math.floor(
							(new Date().getTime() - existing.startedAt.getTime()) / 1000,
						),
					}),
					...(input.status === "identified" &&
						!existing.acknowledgedAt && {
							acknowledgedAt: new Date(),
						}),
				},
			});

			// Create update entry
			await ctx.db.incidentUpdate.create({
				data: {
					incidentId: input.id,
					status: input.status,
					message: input.message,
				},
			});

			return incident;
		}),

	addUpdate: protectedProcedure
		.input(
			z.object({
				incidentId: z.string(),
				message: z.string().min(1, "Message is required"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const incident = await ctx.db.incident.findFirst({
				where: {
					id: input.incidentId,
					monitor: {
						userId: ctx.session.user.id,
					},
				},
			});

			if (!incident) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Incident not found",
				});
			}

			const update = await ctx.db.incidentUpdate.create({
				data: {
					incidentId: input.incidentId,
					status: incident.status,
					message: input.message,
				},
			});

			return update;
		}),

	resolve: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				message: z.string().default("Issue has been resolved."),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.incident.findFirst({
				where: {
					id: input.id,
					monitor: {
						userId: ctx.session.user.id,
					},
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Incident not found",
				});
			}

			const incident = await ctx.db.incident.update({
				where: { id: input.id },
				data: {
					status: "resolved",
					resolvedAt: new Date(),
					duration: Math.floor(
						(new Date().getTime() - existing.startedAt.getTime()) / 1000,
					),
				},
			});

			await ctx.db.incidentUpdate.create({
				data: {
					incidentId: input.id,
					status: "resolved",
					message: input.message,
				},
			});

			return incident;
		}),

	getStats: protectedProcedure.query(async ({ ctx }) => {
		const now = new Date();
		const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

		const [active, resolved, total] = await Promise.all([
			ctx.db.incident.count({
				where: {
					monitor: { userId: ctx.session.user.id },
					status: { not: "resolved" },
				},
			}),
			ctx.db.incident.count({
				where: {
					monitor: { userId: ctx.session.user.id },
					status: "resolved",
					resolvedAt: { gte: thirtyDaysAgo },
				},
			}),
			ctx.db.incident.count({
				where: {
					monitor: { userId: ctx.session.user.id },
					startedAt: { gte: thirtyDaysAgo },
				},
			}),
		]);

		return { active, resolved, total };
	}),
});
