import { db } from "@uptimebeacon/database";
import { Elysia, t } from "elysia";
import { logger } from "../utils/logger";

export const webhookRoutes = new Elysia({ prefix: "/api/webhooks" })
	// Push monitor endpoint - for push-based monitoring
	.post(
		"/push/:token",
		async ({ params, body }) => {
			// Find monitor by push token (stored in authToken field)
			const monitor = await db.monitor.findFirst({
				where: {
					type: "PUSH",
					authToken: params.token,
					active: true,
				},
			});

			if (!monitor) {
				return { error: "Invalid push token" };
			}

			// Record the push as a successful check
			const check = await db.monitorCheck.create({
				data: {
					monitorId: monitor.id,
					status: "UP",
					responseTime: 0,
					message: body?.message ?? "Push received",
				},
			});

			// Update monitor status
			await db.monitor.update({
				where: { id: monitor.id },
				data: {
					status: "UP",
					lastCheckAt: new Date(),
					lastUpAt: new Date(),
				},
			});

			logger.info(`Push received for monitor: ${monitor.name}`);

			return {
				success: true,
				monitorId: monitor.id,
				checkId: check.id,
			};
		},
		{
			params: t.Object({
				token: t.String(),
			}),
			body: t.Optional(
				t.Object({
					message: t.Optional(t.String()),
					status: t.Optional(t.String()),
				}),
			),
		},
	)

	// External webhook for integrations
	.post(
		"/external/:channelId",
		async ({ params, body: _body, headers }) => {
			const channel = await db.notificationChannel.findUnique({
				where: { id: params.channelId },
			});

			if (!channel || channel.type !== "WEBHOOK") {
				return { error: "Invalid webhook channel" };
			}

			// Log incoming webhook for debugging (sanitize sensitive data)
			logger.info(`External webhook received for channel: ${channel.name}`);
			// Only log in development, and sanitize sensitive headers
			if (process.env.NODE_ENV === "development") {
				const sanitizedHeaders = { ...headers };
				// Remove sensitive headers
				const sensitiveHeaders = [
					"authorization",
					"x-api-key",
					"cookie",
					"x-auth-token",
				];
				for (const key of Object.keys(sanitizedHeaders)) {
					if (sensitiveHeaders.includes(key.toLowerCase())) {
						sanitizedHeaders[key] = "[REDACTED]";
					}
				}
				logger.debug("Webhook headers:", sanitizedHeaders);
				// Don't log body as it may contain sensitive data
				logger.debug("Webhook body received (content not logged for security)");
			}

			// Process based on source (could be GitHub, GitLab, etc.)
			// This is a placeholder for custom integrations
			return {
				success: true,
				message: "Webhook received",
			};
		},
		{
			params: t.Object({
				channelId: t.String(),
			}),
		},
	);
