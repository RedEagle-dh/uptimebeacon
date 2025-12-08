import {
	db,
	type Incident,
	type Monitor,
	type NotificationChannel,
} from "@uptimebeacon/database";

import { logger } from "../../utils/logger";
import {
	type ChannelConfig,
	getEventColor,
	getStatusEmoji,
	getStatusText,
	type NotificationEvent,
	type NotificationPayload,
	sendDiscord,
	sendEmail,
	sendResend,
	sendSlack,
	sendTelegram,
	sendWebhook,
} from "./channels";

export async function sendNotifications(
	monitor: Monitor,
	event: NotificationEvent,
	incident?: Incident,
): Promise<void> {
	const monitorNotifications = await db.monitorNotification.findMany({
		where: {
			monitorId: monitor.id,
			...(event === "down" && { notifyOnDown: true }),
			...(event === "up" && { notifyOnUp: true }),
			...(event === "degraded" && { notifyOnDegraded: true }),
		},
		include: { channel: true },
	});

	const results = await Promise.allSettled(
		monitorNotifications.map(({ channel }) =>
			sendToChannel(channel, monitor, event, incident),
		),
	);

	for (const result of results) {
		if (result.status === "rejected") {
			logger.error(`Failed to send notification: ${result.reason}`);
		}
	}
}

async function sendToChannel(
	channel: NotificationChannel,
	monitor: Monitor,
	event: NotificationEvent,
	incident?: Incident,
): Promise<void> {
	const config = channel.config as ChannelConfig;
	const payload = createPayload(monitor, event, incident);

	switch (channel.type) {
		case "SLACK":
			await sendSlack(config, payload);
			break;
		case "DISCORD":
			await sendDiscord(config, payload);
			break;
		case "TELEGRAM":
			await sendTelegram(config, payload);
			break;
		case "WEBHOOK":
			await sendWebhook(config, payload, {
				monitor: {
					id: monitor.id,
					name: monitor.name,
					url: monitor.url,
					status: monitor.status,
				},
			});
			break;
		case "EMAIL":
			await sendEmail(config, payload);
			break;
		case "RESEND":
			await sendResend(config, payload);
			break;
		default:
			logger.warn(`Unknown notification type: ${channel.type}`);
	}

	logger.info(
		`Sent ${event} notification to ${channel.type} channel: ${channel.name}`,
	);
}

function createPayload(
	monitor: Monitor,
	event: NotificationEvent,
	incident?: Incident,
): NotificationPayload {
	const emoji = getStatusEmoji(event);
	const statusText = getStatusText(event);
	const color = getEventColor(event).slack;

	let message = `${emoji} **${monitor.name}** ${statusText}`;
	if (monitor.url) message += `\nURL: ${monitor.url}`;
	if (incident) message += `\nIncident: ${incident.title}`;

	return {
		title: `${monitor.name} Status Update`,
		message,
		event,
		color,
		timestamp: new Date().toISOString(),
	};
}
