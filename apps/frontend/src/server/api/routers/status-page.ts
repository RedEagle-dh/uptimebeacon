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

		const rawMonitors = statusPage?.monitors.map((m) => m.monitor) ?? [];
		const monitorIds = rawMonitors.map((m) => m.id);

		// Fetch active incidents with affectedStatus to compute effective status
		const activeIncidentsByMonitor =
			monitorIds.length > 0
				? await ctx.db.incident.findMany({
						where: {
							monitorId: { in: monitorIds },
							status: { not: "resolved" },
						},
						select: {
							monitorId: true,
							affectedStatus: true,
						},
					})
				: [];

		// Group incidents by monitor
		const incidentsByMonitor = new Map<
			string,
			Array<{ affectedStatus: string }>
		>();
		for (const incident of activeIncidentsByMonitor) {
			const existing = incidentsByMonitor.get(incident.monitorId) ?? [];
			existing.push({ affectedStatus: incident.affectedStatus });
			incidentsByMonitor.set(incident.monitorId, existing);
		}

		// Compute effective status for each monitor
		const monitors = rawMonitors.map((m) => {
			const monitorIncidents = incidentsByMonitor.get(m.id) ?? [];
			const effectiveStatus = getEffectiveMonitorStatus(
				m.status,
				monitorIncidents,
			);
			return { ...m, status: effectiveStatus };
		});

		const overallStatus = getOverallStatus(monitors.map((m) => m.status));

		// Get uptime history for the last 90 days
		const days = statusPage?.daysToShow ?? 90;
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);
		startDate.setHours(0, 0, 0, 0);

		// Group checks by day - initialize all days first
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

		if (monitorIds.length > 0) {
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
			const allIncidents = await ctx.db.incident.findMany({
				where: {
					monitorId: { in: monitorIds },
					startedAt: { gte: startDate },
				},
				select: {
					startedAt: true,
					resolvedAt: true,
				},
			});

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
			for (const incident of allIncidents) {
				const day = incident.startedAt.toISOString().split("T")[0]!;
				if (dailyData[day]) {
					dailyData[day].incidents++;
				}
			}
		}

		const uptimeHistory = Object.entries(dailyData)
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

		// Get response time history for each monitor (uses same daysToShow setting)
		const responseTimeStartDate = new Date();
		responseTimeStartDate.setDate(responseTimeStartDate.getDate() - days);
		responseTimeStartDate.setHours(0, 0, 0, 0);

		let responseTimeHistory: Array<{
			monitorId: string;
			monitorName: string;
			data: Array<{
				date: string;
				avgResponseTime: number | null;
			}>;
		}> = [];

		if (monitorIds.length > 0) {
			const responseTimeChecks = await ctx.db.monitorCheck.findMany({
				where: {
					monitorId: { in: monitorIds },
					createdAt: { gte: responseTimeStartDate },
					responseTime: { not: null },
				},
				select: {
					monitorId: true,
					responseTime: true,
					createdAt: true,
				},
				orderBy: { createdAt: "asc" },
			});

			// Group by monitor and day
			const monitorDailyData: Record<string, Record<string, number[]>> = {};

			// Initialize all days for each monitor
			for (const monitorId of monitorIds) {
				monitorDailyData[monitorId] = {};
				for (let i = 0; i < days; i++) {
					const date = new Date();
					date.setDate(date.getDate() - (days - 1 - i));
					const dayKey = date.toISOString().split("T")[0]!;
					monitorDailyData[monitorId][dayKey] = [];
				}
			}

			// Collect response times per monitor per day
			for (const check of responseTimeChecks) {
				const day = check.createdAt.toISOString().split("T")[0]!;
				const monitorData = monitorDailyData[check.monitorId];
				if (monitorData?.[day] && check.responseTime !== null) {
					monitorData[day].push(check.responseTime);
				}
			}

			// Build response time history
			responseTimeHistory = monitors.map((monitor) => ({
				monitorId: monitor.id,
				monitorName: monitor.name,
				data: Object.entries(monitorDailyData[monitor.id] ?? {})
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([date, responseTimes]) => ({
						date,
						avgResponseTime:
							responseTimes.length > 0
								? Math.round(
										responseTimes.reduce((sum, rt) => sum + rt, 0) /
											responseTimes.length,
									)
								: null,
					})),
			}));
		}

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
			uptimeHistory,
			responseTimeHistory,
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
								id: true,
								status: true,
							},
						},
					},
				},
			},
		});

		// Get all monitor IDs across all status pages
		const allMonitorIds = statusPages.flatMap((page) =>
			page.monitors.map((m) => m.monitor.id),
		);

		// Fetch active incidents for all monitors
		const activeIncidents =
			allMonitorIds.length > 0
				? await ctx.db.incident.findMany({
						where: {
							monitorId: { in: allMonitorIds },
							status: { not: "resolved" },
						},
						select: {
							monitorId: true,
							affectedStatus: true,
						},
					})
				: [];

		// Group incidents by monitor
		const incidentsByMonitor = new Map<
			string,
			Array<{ affectedStatus: string }>
		>();
		for (const incident of activeIncidents) {
			const existing = incidentsByMonitor.get(incident.monitorId) ?? [];
			existing.push({ affectedStatus: incident.affectedStatus });
			incidentsByMonitor.set(incident.monitorId, existing);
		}

		return statusPages.map((page) => {
			const effectiveStatuses = page.monitors.map((m) => {
				const monitorIncidents = incidentsByMonitor.get(m.monitor.id) ?? [];
				return getEffectiveMonitorStatus(m.monitor.status, monitorIncidents);
			});

			return {
				...page,
				overallStatus: getOverallStatus(effectiveStatuses),
			};
		});
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

			const monitorIds = statusPage.monitors.map((m) => m.monitor.id);

			// Fetch active incidents with affectedStatus to compute effective status
			const activeIncidentsByMonitor =
				monitorIds.length > 0
					? await ctx.db.incident.findMany({
							where: {
								monitorId: { in: monitorIds },
								status: { not: "resolved" },
							},
							select: {
								monitorId: true,
								affectedStatus: true,
							},
						})
					: [];

			// Group incidents by monitor
			const incidentsByMonitor = new Map<
				string,
				Array<{ affectedStatus: string }>
			>();
			for (const incident of activeIncidentsByMonitor) {
				const existing = incidentsByMonitor.get(incident.monitorId) ?? [];
				existing.push({ affectedStatus: incident.affectedStatus });
				incidentsByMonitor.set(incident.monitorId, existing);
			}

			// Transform monitors with effective status
			const monitorsWithEffectiveStatus = statusPage.monitors.map((m) => {
				const monitorIncidents = incidentsByMonitor.get(m.monitor.id) ?? [];
				const effectiveStatus = getEffectiveMonitorStatus(
					m.monitor.status,
					monitorIncidents,
				);
				return {
					...m,
					monitor: { ...m.monitor, status: effectiveStatus },
				};
			});

			const overallStatus = getOverallStatus(
				monitorsWithEffectiveStatus.map((m) => m.monitor.status),
			);

			return {
				...statusPage,
				monitors: monitorsWithEffectiveStatus,
				overallStatus,
			};
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

			const monitorIds = statusPage.monitors.map((m) => m.monitor.id);

			// Fetch active incidents with affectedStatus to compute effective status
			const activeIncidentsByMonitor =
				monitorIds.length > 0
					? await ctx.db.incident.findMany({
							where: {
								monitorId: { in: monitorIds },
								status: { not: "resolved" },
							},
							select: {
								monitorId: true,
								affectedStatus: true,
							},
						})
					: [];

			// Group incidents by monitor
			const incidentsByMonitor = new Map<
				string,
				Array<{ affectedStatus: string }>
			>();
			for (const incident of activeIncidentsByMonitor) {
				const existing = incidentsByMonitor.get(incident.monitorId) ?? [];
				existing.push({ affectedStatus: incident.affectedStatus });
				incidentsByMonitor.set(incident.monitorId, existing);
			}

			// Transform monitors with effective status
			const monitorsWithEffectiveStatus = statusPage.monitors.map((m) => {
				const monitorIncidents = incidentsByMonitor.get(m.monitor.id) ?? [];
				const effectiveStatus = getEffectiveMonitorStatus(
					m.monitor.status,
					monitorIncidents,
				);
				return {
					...m,
					monitor: { ...m.monitor, status: effectiveStatus },
				};
			});

			const overallStatus = getOverallStatus(
				monitorsWithEffectiveStatus.map((m) => m.monitor.status),
			);

			// Get uptime history if enabled
			let uptimeHistory: {
				date: string;
				status: "UP" | "DOWN" | "DEGRADED" | "PENDING";
				incidents: number;
				downtimeMinutes: number;
			}[] = [];

			if (statusPage.showUptimeGraph && monitorIds.length > 0) {
				const days = statusPage.daysToShow;
				const startDate = new Date();
				startDate.setDate(startDate.getDate() - days);
				startDate.setHours(0, 0, 0, 0);

				// Initialize daily data
				const dailyData: Record<
					string,
					{ up: number; down: number; degraded: number; incidents: number }
				> = {};

				for (let i = 0; i < days; i++) {
					const date = new Date();
					date.setDate(date.getDate() - (days - 1 - i));
					const dayKey = date.toISOString().split("T")[0]!;
					dailyData[dayKey] = { up: 0, down: 0, degraded: 0, incidents: 0 };
				}

				// Get all checks for monitors in the date range
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
				const allIncidents = await ctx.db.incident.findMany({
					where: {
						monitorId: { in: monitorIds },
						startedAt: { gte: startDate },
					},
					select: {
						startedAt: true,
					},
				});

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
				for (const incident of allIncidents) {
					const day = incident.startedAt.toISOString().split("T")[0]!;
					if (dailyData[day]) {
						dailyData[day].incidents++;
					}
				}

				uptimeHistory = Object.entries(dailyData)
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
			}

			// Get incidents if enabled
			let activeIncidents: {
				id: string;
				title: string;
				description: string | null;
				status: string;
				severity: string;
				startedAt: Date;
				monitor: { id: string; name: string };
			}[] = [];

			let recentResolvedIncidents: typeof activeIncidents = [];

			if (statusPage.showIncidentHistory && monitorIds.length > 0) {
				activeIncidents = await ctx.db.incident.findMany({
					where: {
						monitorId: { in: monitorIds },
						status: { not: "resolved" },
					},
					take: 10,
					orderBy: { startedAt: "desc" },
					select: {
						id: true,
						title: true,
						description: true,
						status: true,
						severity: true,
						startedAt: true,
						monitor: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				});

				recentResolvedIncidents = await ctx.db.incident.findMany({
					where: {
						monitorId: { in: monitorIds },
						status: "resolved",
						resolvedAt: {
							gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
						},
					},
					take: 5,
					orderBy: { resolvedAt: "desc" },
					select: {
						id: true,
						title: true,
						description: true,
						status: true,
						severity: true,
						startedAt: true,
						monitor: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				});
			}

			// Get response time history for each monitor (uses same daysToShow setting)
			const responseTimeDays = statusPage.daysToShow;
			let responseTimeHistory: Array<{
				monitorId: string;
				monitorName: string;
				data: Array<{
					date: string;
					avgResponseTime: number | null;
				}>;
			}> = [];

			if (statusPage.showUptimeGraph && monitorIds.length > 0) {
				const responseTimeStartDate = new Date();
				responseTimeStartDate.setDate(
					responseTimeStartDate.getDate() - responseTimeDays,
				);
				responseTimeStartDate.setHours(0, 0, 0, 0);

				const responseTimeChecks = await ctx.db.monitorCheck.findMany({
					where: {
						monitorId: { in: monitorIds },
						createdAt: { gte: responseTimeStartDate },
						responseTime: { not: null },
					},
					select: {
						monitorId: true,
						responseTime: true,
						createdAt: true,
					},
					orderBy: { createdAt: "asc" },
				});

				// Group by monitor and day
				const monitorDailyData: Record<string, Record<string, number[]>> = {};

				// Initialize all days for each monitor
				for (const monitorId of monitorIds) {
					monitorDailyData[monitorId] = {};
					for (let i = 0; i < responseTimeDays; i++) {
						const date = new Date();
						date.setDate(date.getDate() - (responseTimeDays - 1 - i));
						const dayKey = date.toISOString().split("T")[0]!;
						monitorDailyData[monitorId][dayKey] = [];
					}
				}

				// Collect response times per monitor per day
				for (const check of responseTimeChecks) {
					const day = check.createdAt.toISOString().split("T")[0]!;
					const monitorData = monitorDailyData[check.monitorId];
					if (monitorData?.[day] && check.responseTime !== null) {
						monitorData[day].push(check.responseTime);
					}
				}

				// Build response time history using monitors with displayName
				responseTimeHistory = statusPage.monitors.map((sm) => ({
					monitorId: sm.monitor.id,
					monitorName: sm.displayName ?? sm.monitor.name,
					data: Object.entries(monitorDailyData[sm.monitor.id] ?? {})
						.sort(([a], [b]) => a.localeCompare(b))
						.map(([date, responseTimes]) => ({
							date,
							avgResponseTime:
								responseTimes.length > 0
									? Math.round(
											responseTimes.reduce((sum, rt) => sum + rt, 0) /
												responseTimes.length,
										)
									: null,
						})),
				}));
			}

			return {
				...statusPage,
				monitors: monitorsWithEffectiveStatus,
				overallStatus,
				uptimeHistory,
				activeIncidents,
				recentResolvedIncidents,
				responseTimeHistory,
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

// Status priority: DOWN > DEGRADED > MAINTENANCE > UP > PENDING
const STATUS_PRIORITY: Record<string, number> = {
	DOWN: 5,
	DEGRADED: 4,
	MAINTENANCE: 3,
	UP: 2,
	PENDING: 1,
};

function getWorstStatus(statuses: string[]): string {
	if (statuses.length === 0) return "PENDING";
	return statuses.reduce((worst, current) => {
		const worstPriority = STATUS_PRIORITY[worst] ?? 0;
		const currentPriority = STATUS_PRIORITY[current] ?? 0;
		return currentPriority > worstPriority ? current : worst;
	}, "PENDING");
}

function getEffectiveMonitorStatus(
	automatedStatus: string,
	activeIncidents: Array<{ affectedStatus: string }>,
): string {
	if (activeIncidents.length === 0) return automatedStatus;
	const incidentStatuses = activeIncidents.map((i) => i.affectedStatus);
	return getWorstStatus([automatedStatus, ...incidentStatuses]);
}
