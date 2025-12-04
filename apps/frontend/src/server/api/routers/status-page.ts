import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";

export const statusPageRouter = createTRPCRouter({
	getPublicOverview: publicProcedure.query(async ({ ctx }) => {
		// Get the first public status page with monitors
		const statusPage = await ctx.db.statusPage.findFirst({
			where: { isPublic: true },
			orderBy: { createdAt: "asc" },
			include: {
				monitors: {
					orderBy: { order: "asc" },
					include: {
						monitor: {
							select: {
								id: true,
								name: true,
								status: true,
								uptimePercentage: true,
								avgResponseTime: true,
								lastCheckAt: true,
							},
						},
					},
				},
			},
		});

		// Get recent active incidents
		const incidents = await ctx.db.incident.findMany({
			where: {
				status: { not: "resolved" },
			},
			take: 10,
			orderBy: { startedAt: "desc" },
			include: {
				monitor: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		// Get recent resolved incidents
		const recentResolvedIncidents = await ctx.db.incident.findMany({
			where: {
				status: "resolved",
				resolvedAt: {
					gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
				},
			},
			take: 5,
			orderBy: { resolvedAt: "desc" },
			include: {
				monitor: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		const monitors = statusPage?.monitors.map((m) => m.monitor) ?? [];
		const overallStatus = getOverallStatus(monitors.map((m) => m.status));

		return {
			statusPage: statusPage
				? {
						id: statusPage.id,
						name: statusPage.name,
						slug: statusPage.slug,
						description: statusPage.description,
						logoUrl: statusPage.logoUrl,
						daysToShow: statusPage.daysToShow,
					}
				: null,
			monitors,
			overallStatus,
			activeIncidents: incidents,
			recentResolvedIncidents,
		};
	}),

	getAll: protectedProcedure.query(async ({ ctx }) => {
		const statusPages = await ctx.db.statusPage.findMany({
			where: { userId: ctx.session.user.id },
			orderBy: { createdAt: "desc" },
			include: {
				_count: {
					select: { monitors: true },
				},
				monitors: {
					include: {
						monitor: {
							select: {
								status: true,
							},
						},
					},
				},
			},
		});

		return statusPages.map((page) => ({
			...page,
			overallStatus: getOverallStatus(
				page.monitors.map((m) => m.monitor.status),
			),
		}));
	}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const statusPage = await ctx.db.statusPage.findFirst({
				where: {
					id: input.id,
					userId: ctx.session.user.id,
				},
				include: {
					monitors: {
						orderBy: { order: "asc" },
						include: {
							monitor: true,
						},
					},
				},
			});

			if (!statusPage) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Status page not found",
				});
			}

			return statusPage;
		}),

	getBySlug: publicProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const statusPage = await ctx.db.statusPage.findFirst({
				where: {
					slug: input.slug,
					isPublic: true,
				},
				include: {
					monitors: {
						orderBy: { order: "asc" },
						include: {
							monitor: {
								select: {
									id: true,
									name: true,
									status: true,
									uptimePercentage: true,
									avgResponseTime: true,
									lastCheckAt: true,
								},
							},
						},
					},
				},
			});

			if (!statusPage) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Status page not found",
				});
			}

			return {
				...statusPage,
				overallStatus: getOverallStatus(
					statusPage.monitors.map((m) => m.monitor.status),
				),
			};
		}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1, "Name is required"),
				slug: z
					.string()
					.min(3, "Slug must be at least 3 characters")
					.regex(
						/^[a-z0-9-]+$/,
						"Slug can only contain lowercase letters, numbers, and hyphens",
					),
				description: z.string().optional(),
				logoUrl: z.string().url().optional().or(z.literal("")),
				faviconUrl: z.string().url().optional().or(z.literal("")),
				customDomain: z.string().optional(),
				isPublic: z.boolean().default(true),
				showIncidentHistory: z.boolean().default(true),
				showUptimeGraph: z.boolean().default(true),
				daysToShow: z.number().int().min(7).max(90).default(90),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if slug is already taken
			const existing = await ctx.db.statusPage.findUnique({
				where: { slug: input.slug },
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "A status page with this slug already exists",
				});
			}

			const statusPage = await ctx.db.statusPage.create({
				data: {
					...input,
					logoUrl: input.logoUrl || null,
					faviconUrl: input.faviconUrl || null,
					userId: ctx.session.user.id,
				},
			});

			return statusPage;
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().optional(),
				slug: z
					.string()
					.min(3)
					.regex(/^[a-z0-9-]+$/)
					.optional(),
				description: z.string().optional(),
				logoUrl: z.string().url().optional().or(z.literal("")),
				faviconUrl: z.string().url().optional().or(z.literal("")),
				customCss: z.string().optional(),
				customDomain: z.string().optional(),
				isPublic: z.boolean().optional(),
				showIncidentHistory: z.boolean().optional(),
				showUptimeGraph: z.boolean().optional(),
				daysToShow: z.number().int().min(7).max(90).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.statusPage.findFirst({
				where: {
					id: input.id,
					userId: ctx.session.user.id,
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Status page not found",
				});
			}

			// Check if new slug is already taken by another page
			if (input.slug && input.slug !== existing.slug) {
				const slugExists = await ctx.db.statusPage.findUnique({
					where: { slug: input.slug },
				});

				if (slugExists) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "A status page with this slug already exists",
					});
				}
			}

			const { id, ...data } = input;

			const statusPage = await ctx.db.statusPage.update({
				where: { id },
				data: {
					...data,
					logoUrl: data.logoUrl === "" ? null : data.logoUrl,
					faviconUrl: data.faviconUrl === "" ? null : data.faviconUrl,
				},
			});

			return statusPage;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.statusPage.findFirst({
				where: {
					id: input.id,
					userId: ctx.session.user.id,
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Status page not found",
				});
			}

			await ctx.db.statusPage.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	addMonitor: protectedProcedure
		.input(
			z.object({
				statusPageId: z.string(),
				monitorId: z.string(),
				displayName: z.string().optional(),
				order: z.number().int().default(0),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [statusPage, monitor] = await Promise.all([
				ctx.db.statusPage.findFirst({
					where: {
						id: input.statusPageId,
						userId: ctx.session.user.id,
					},
				}),
				ctx.db.monitor.findFirst({
					where: {
						id: input.monitorId,
						userId: ctx.session.user.id,
					},
				}),
			]);

			if (!statusPage) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Status page not found",
				});
			}

			if (!monitor) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Monitor not found",
				});
			}

			const relation = await ctx.db.statusPageMonitor.create({
				data: {
					statusPageId: input.statusPageId,
					monitorId: input.monitorId,
					displayName: input.displayName,
					order: input.order,
				},
			});

			return relation;
		}),

	removeMonitor: protectedProcedure
		.input(
			z.object({
				statusPageId: z.string(),
				monitorId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const statusPage = await ctx.db.statusPage.findFirst({
				where: {
					id: input.statusPageId,
					userId: ctx.session.user.id,
				},
			});

			if (!statusPage) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Status page not found",
				});
			}

			await ctx.db.statusPageMonitor.delete({
				where: {
					statusPageId_monitorId: {
						statusPageId: input.statusPageId,
						monitorId: input.monitorId,
					},
				},
			});

			return { success: true };
		}),

	reorderMonitors: protectedProcedure
		.input(
			z.object({
				statusPageId: z.string(),
				monitorOrders: z.array(
					z.object({
						monitorId: z.string(),
						order: z.number().int(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const statusPage = await ctx.db.statusPage.findFirst({
				where: {
					id: input.statusPageId,
					userId: ctx.session.user.id,
				},
			});

			if (!statusPage) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Status page not found",
				});
			}

			await Promise.all(
				input.monitorOrders.map(({ monitorId, order }) =>
					ctx.db.statusPageMonitor.update({
						where: {
							statusPageId_monitorId: {
								statusPageId: input.statusPageId,
								monitorId,
							},
						},
						data: { order },
					}),
				),
			);

			return { success: true };
		}),
});

function getOverallStatus(statuses: string[]): string {
	if (statuses.length === 0) return "PENDING";
	if (statuses.some((s) => s === "DOWN")) return "DOWN";
	if (statuses.some((s) => s === "DEGRADED")) return "DEGRADED";
	if (statuses.some((s) => s === "MAINTENANCE")) return "MAINTENANCE";
	if (statuses.some((s) => s === "PENDING")) return "PENDING";
	return "UP";
}
