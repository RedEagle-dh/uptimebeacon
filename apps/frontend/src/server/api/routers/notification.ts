import { TRPCError } from "@trpc/server";
import {
	decrypt,
	encrypt,
	isEncrypted,
	maskSensitiveValue,
} from "@uptimebeacon/database";
import { z } from "zod";

import { env } from "@/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const notificationConfigSchema = z.object({
	// Common email fields
	email: z.string().email().optional(),
	fromEmail: z.string().email().optional(),
	fromName: z.string().optional(),
	// Email (SMTP)
	smtpHost: z.string().optional(),
	smtpPort: z.string().optional(),
	smtpUser: z.string().optional(),
	smtpPassword: z.string().optional(),
	// Resend
	resendApiKey: z.string().optional(),
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

// Fields that contain sensitive data requiring encryption
const SENSITIVE_FIELDS = [
	"smtpPassword",
	"resendApiKey",
	"telegramBotToken",
	"slackWebhookUrl",
	"discordWebhookUrl",
	"webhookUrl",
] as const;

function getSecret(): string {
	if (!env.AUTH_SECRET) {
		throw new Error("AUTH_SECRET is required for encryption");
	}
	return env.AUTH_SECRET;
}

function processConfigFields(
	config: Record<string, unknown>,
	processor: (value: string) => string,
): Record<string, unknown> {
	const result = { ...config };
	for (const field of SENSITIVE_FIELDS) {
		const value = result[field];
		if (typeof value === "string" && value.length > 0) {
			result[field] = processor(value);
		}
	}
	return result;
}

function encryptConfig(
	config: Record<string, unknown>,
): Record<string, unknown> {
	const secret = getSecret();
	return processConfigFields(config, (value) =>
		value.startsWith("****") ? value : encrypt(value, secret),
	);
}

function decryptConfig(
	config: Record<string, unknown>,
): Record<string, unknown> {
	const secret = getSecret();
	return processConfigFields(config, (value) => {
		if (!isEncrypted(value)) return value;
		try {
			return decrypt(value, secret);
		} catch {
			return value; // Legacy unencrypted data
		}
	});
}

function maskConfig(config: Record<string, unknown>): Record<string, unknown> {
	const secret = getSecret();
	return processConfigFields(config, (value) => {
		let decrypted = value;
		if (isEncrypted(value)) {
			try {
				decrypted = decrypt(value, secret);
			} catch {
				// Use original value if decryption fails
			}
		}
		return maskSensitiveValue(decrypted);
	});
}

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

			// Mask sensitive fields for display
			return {
				...channel,
				config: maskConfig(channel.config as Record<string, unknown>),
			};
		}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1, "Name is required"),
				type: z.enum([
					"EMAIL",
					"RESEND",
					"SLACK",
					"DISCORD",
					"TELEGRAM",
					"WEBHOOK",
				]),
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

			// Encrypt sensitive fields before storage
			const encryptedConfig = encryptConfig(
				input.config as Record<string, unknown>,
			);

			const channel = await ctx.db.notificationChannel.create({
				data: {
					name: input.name,
					type: input.type,
					config: JSON.parse(JSON.stringify(encryptedConfig)),
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

			// Handle config update with encryption
			let processedConfig: Record<string, unknown> | undefined;
			if (input.config) {
				const existingConfig = existing.config as Record<string, unknown>;
				const newConfig = input.config as Record<string, unknown>;

				// Merge configs: keep existing encrypted values for masked fields
				const mergedConfig: Record<string, unknown> = { ...newConfig };
				for (const field of SENSITIVE_FIELDS) {
					const newValue = newConfig[field];
					// If the new value is masked (starts with ****), keep the existing encrypted value
					if (typeof newValue === "string" && newValue.startsWith("****")) {
						mergedConfig[field] = existingConfig[field];
					}
				}

				// Encrypt any new sensitive values
				processedConfig = encryptConfig(mergedConfig);
			}

			const channel = await ctx.db.notificationChannel.update({
				where: { id: input.id },
				data: {
					name: input.name,
					config: processedConfig
						? JSON.parse(JSON.stringify(processedConfig))
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

			// Debug: log raw config from DB
			const rawConfig = channel.config as Record<string, unknown>;
			console.log("[TEST] Raw config from DB:", JSON.stringify(rawConfig));

			// Decrypt sensitive fields before sending to backend
			const decryptedConfig = decryptConfig(rawConfig);

			// Debug: log decrypted config
			console.log("[TEST] Decrypted config:", JSON.stringify(decryptedConfig));

			// Call backend to send test notification
			const backendUrl = env.BACKEND_URL ?? "http://localhost:3001";
			const response = await fetch(`${backendUrl}/api/notifications/test`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					channelId: channel.id,
					channelType: channel.type,
					channelName: channel.name,
					config: decryptedConfig,
				}),
			});

			if (!response.ok) {
				const errorData = (await response.json().catch(() => ({}))) as {
					message?: string;
				};
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: errorData.message ?? "Failed to send test notification",
				});
			}

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

	revealSecret: protectedProcedure
		.input(
			z.object({
				channelId: z.string(),
				fieldName: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
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

			const config = channel.config as Record<string, unknown>;
			const encryptedValue = config[input.fieldName];

			if (typeof encryptedValue !== "string") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Field not found or not a string",
				});
			}

			// Decrypt the value
			const secret = getSecret();
			let decryptedValue = encryptedValue;
			if (isEncrypted(encryptedValue)) {
				try {
					decryptedValue = decrypt(encryptedValue, secret);
				} catch {
					// Return original if decryption fails
				}
			}

			return { value: decryptedValue };
		}),
});
