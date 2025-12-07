import {
	db,
	type Incident,
	type Monitor,
	type NotificationChannel,
} from "@uptimebeacon/database";
import { logger } from "../../utils/logger";

type NotificationEvent = "down" | "up" | "degraded";

export async function sendNotifications(
	monitor: Monitor,
	event: NotificationEvent,
	incident?: Incident,
): Promise<void> {
	// Get all notification channels for this monitor
	const monitorNotifications = await db.monitorNotification.findMany({
		where: {
			monitorId: monitor.id,
			...(event === "down" && { notifyOnDown: true }),
			...(event === "up" && { notifyOnUp: true }),
			...(event === "degraded" && { notifyOnDegraded: true }),
		},
		include: {
			channel: true,
		},
	});

	for (const { channel } of monitorNotifications) {
		try {
			await sendToChannel(channel, monitor, event, incident);
			logger.info(
				`Sent ${event} notification to ${channel.type} channel: ${channel.name}`,
			);
		} catch (error) {
			logger.error(
				`Failed to send notification to ${channel.type} channel: ${channel.name}`,
				error,
			);
		}
	}
}

async function sendToChannel(
	channel: NotificationChannel,
	monitor: Monitor,
	event: NotificationEvent,
	incident?: Incident,
): Promise<void> {
	const config = channel.config as Record<string, unknown>;
	const message = formatMessage(monitor, event, incident);

	switch (channel.type) {
		case "WEBHOOK":
			await sendWebhook(config, message, monitor, event);
			break;
		case "DISCORD":
			await sendDiscord(config, message, monitor, event);
			break;
		case "SLACK":
			await sendSlack(config, message, monitor, event);
			break;
		case "TELEGRAM":
			await sendTelegram(config, message);
			break;
		case "EMAIL":
			// Email would require an email service like Resend, SendGrid, etc.
			logger.warn("Email notifications not yet implemented");
			break;
		default:
			logger.warn(`Unknown notification type: ${channel.type}`);
	}
}

function formatMessage(
	monitor: Monitor,
	event: NotificationEvent,
	incident?: Incident,
): string {
	const statusEmoji = event === "up" ? "✅" : event === "down" ? "🔴" : "🟡";
	const statusText =
		event === "up"
			? "is back online"
			: event === "down"
				? "is down"
				: "is degraded";

	let message = `${statusEmoji} **${monitor.name}** ${statusText}`;

	if (monitor.url) {
		message += `\nURL: ${monitor.url}`;
	}

	if (incident) {
		message += `\nIncident: ${incident.title}`;
	}

	message += `\nTime: ${new Date().toISOString()}`;

	return message;
}

async function sendWebhook(
	config: Record<string, unknown>,
	message: string,
	monitor: Monitor,
	event: NotificationEvent,
): Promise<void> {
	const url = config.url as string;
	if (!url) throw new Error("Webhook URL is required");

	await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			monitor: {
				id: monitor.id,
				name: monitor.name,
				url: monitor.url,
				status: monitor.status,
			},
			event,
			message,
			timestamp: new Date().toISOString(),
		}),
	});
}

async function sendDiscord(
	config: Record<string, unknown>,
	message: string,
	monitor: Monitor,
	event: NotificationEvent,
): Promise<void> {
	const webhookUrl = config.webhookUrl as string;
	if (!webhookUrl) throw new Error("Discord webhook URL is required");

	const color =
		event === "up" ? 0x00ff00 : event === "down" ? 0xff0000 : 0xffff00;

	await fetch(webhookUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			embeds: [
				{
					title: `${monitor.name} Status Update`,
					description: message,
					color,
					timestamp: new Date().toISOString(),
				},
			],
		}),
	});
}

async function sendSlack(
	config: Record<string, unknown>,
	message: string,
	monitor: Monitor,
	event: NotificationEvent,
): Promise<void> {
	const webhookUrl = config.webhookUrl as string;
	if (!webhookUrl) throw new Error("Slack webhook URL is required");

	const color =
		event === "up" ? "good" : event === "down" ? "danger" : "warning";

	await fetch(webhookUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			attachments: [
				{
					color,
					title: `${monitor.name} Status Update`,
					text: message,
					ts: Math.floor(Date.now() / 1000),
				},
			],
		}),
	});
}

async function sendTelegram(
	config: Record<string, unknown>,
	message: string,
): Promise<void> {
	const botToken = config.botToken as string;
	const chatId = config.chatId as string;

	if (!botToken || !chatId) {
		throw new Error("Telegram bot token and chat ID are required");
	}

	await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			chat_id: chatId,
			text: message,
			parse_mode: "Markdown",
		}),
	});
}
