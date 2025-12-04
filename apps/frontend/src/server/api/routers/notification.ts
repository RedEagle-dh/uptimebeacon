import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const notificationConfigSchema = z.object({
	// Email
	email: z.string().email().optional(),
	// Slack
	slackWebhookUrl: z.string().url().optional(),
	slackChannel: z.string().optional(),
	// Discord
	discordWebhookUrl: z.string().url().optional(),
	// Telegram
	telegramBotToken: z.string().optional(),
	telegramChatId: z.string().optional(),
	// Generic Webhook
	webhookUrl: z.string().url().optional(),
	webhookMethod: z.enum(["GET", "POST"]).optional(),
	webhookHeaders: z.record(z.string(), z.string()).optional(),
});

export const notificationRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const channels = await ctx.db.notificationChannel.findMany({
			where: { userId: ctx.session.user.id },
			orderBy: { createdAt: "desc" },
			include: {
				_count: {
					select: { monitors: true },
				},
			},
		});

		return channels;
	}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const channel = await ctx.db.notificationChannel.findFirst({
				where: {
					id: input.id,
					userId: ctx.session.user.id,
				},
				include: {
					monitors: {
						include: {
							monitor: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
				},
			});

			if (!channel) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Notification channel not found",
				});
			}

			return channel;
		}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1, "Name is required"),
				type: z.enum(["EMAIL", "SLACK", "DISCORD", "TELEGRAM", "WEBHOOK"]),
				config: notificationConfigSchema,
				isDefault: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// If setting as default, unset other defaults
			if (input.isDefault) {
				await ctx.db.notificationChannel.updateMany({
					where: {
						userId: ctx.session.user.id,
						isDefault: true,
					},
					data: { isDefault: false },
				});
			}

			const channel = await ctx.db.notificationChannel.create({
				data: {
					name: input.name,
					type: input.type,
					config: JSON.parse(JSON.stringify(input.config)),
					isDefault: input.isDefault,
					userId: ctx.session.user.id,
				},
			});

			return channel;
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().optional(),
				config: notificationConfigSchema.optional(),
				isDefault: z.boolean().optional(),
				active: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.notificationChannel.findFirst({
				where: {
					id: input.id,
					userId: ctx.session.user.id,
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Notification channel not found",
				});
			}

			// If setting as default, unset other defaults
			if (input.isDefault) {
				await ctx.db.notificationChannel.updateMany({
					where: {
						userId: ctx.session.user.id,
						isDefault: true,
						id: { not: input.id },
					},
					data: { isDefault: false },
				});
			}

			const channel = await ctx.db.notificationChannel.update({
				where: { id: input.id },
				data: {
					name: input.name,
					config: input.config
						? JSON.parse(JSON.stringify(input.config))
						: undefined,
					isDefault: input.isDefault,
					active: input.active,
				},
			});

			return channel;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.notificationChannel.findFirst({
				where: {
					id: input.id,
					userId: ctx.session.user.id,
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Notification channel not found",
				});
			}

			await ctx.db.notificationChannel.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	test: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const channel = await ctx.db.notificationChannel.findFirst({
				where: {
					id: input.id,
					userId: ctx.session.user.id,
				},
			});

			if (!channel) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Notification channel not found",
				});
			}

			// TODO: Implement actual notification sending via backend
			// For now, just return success
			return { success: true, message: "Test notification sent" };
		}),

	linkMonitor: protectedProcedure
		.input(
			z.object({
				channelId: z.string(),
				monitorId: z.string(),
				notifyOnDown: z.boolean().default(true),
				notifyOnUp: z.boolean().default(true),
				notifyOnDegraded: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [channel, monitor] = await Promise.all([
				ctx.db.notificationChannel.findFirst({
					where: {
						id: input.channelId,
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

			if (!channel) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Notification channel not found",
				});
			}

			if (!monitor) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Monitor not found",
				});
			}

			const relation = await ctx.db.monitorNotification.upsert({
				where: {
					monitorId_channelId: {
						monitorId: input.monitorId,
						channelId: input.channelId,
					},
				},
				create: {
					monitorId: input.monitorId,
					channelId: input.channelId,
					notifyOnDown: input.notifyOnDown,
					notifyOnUp: input.notifyOnUp,
					notifyOnDegraded: input.notifyOnDegraded,
				},
				update: {
					notifyOnDown: input.notifyOnDown,
					notifyOnUp: input.notifyOnUp,
					notifyOnDegraded: input.notifyOnDegraded,
				},
			});

			return relation;
		}),

	unlinkMonitor: protectedProcedure
		.input(
			z.object({
				channelId: z.string(),
				monitorId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const channel = await ctx.db.notificationChannel.findFirst({
				where: {
					id: input.channelId,
					userId: ctx.session.user.id,
				},
			});

			if (!channel) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Notification channel not found",
				});
			}

			await ctx.db.monitorNotification.delete({
				where: {
					monitorId_channelId: {
						monitorId: input.monitorId,
						channelId: input.channelId,
					},
				},
			});

			return { success: true };
		}),
});
