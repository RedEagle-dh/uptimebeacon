import {
	db,
	decrypt,
	type Incident,
	isEncrypted,
	type Monitor,
	type MonitorStatus,
	type NotificationChannel,
} from "@uptimebeacon/database";

import { logger } from "../../utils/logger";
import {
	type ChannelConfig,
	formatDuration,
	getEventColor,
	getStatusEmoji,
	getStatusText,
	type NotificationEvent,
	type RichNotificationPayload,
	sendDiscord,
	sendEmail,
	sendResend,
	sendSlack,
	sendTelegram,
	sendWebhook,
} from "./channels";

// Options for sending notifications
export interface SendNotificationOptions {
	monitor: Monitor;
	event: NotificationEvent;
	incident?: Incident;
	previousStatus?: MonitorStatus;
	responseTime?: number;
	statusCode?: number;
	// SSL data (from check result)
	sslExpiryDate?: Date;
	sslDaysRemaining?: number;
}

// Sensitive fields that need decryption
const SENSITIVE_FIELDS = [
	"smtpPassword",
	"resendApiKey",
	"telegramBotToken",
	"slackWebhookUrl",
	"discordWebhookUrl",
	"webhookUrl",
];

function isSensitiveField(fieldName: string): boolean {
	if (SENSITIVE_FIELDS.includes(fieldName)) return true;
	if (fieldName.startsWith("webhookHeader_")) return true;
	return false;
}

// Decrypt config fields and convert webhookHeader_* to webhookHeaders
function processConfig(config: ChannelConfig, secret: string): ChannelConfig {
	const result: ChannelConfig = {};
	const webhookHeaders: Record<string, string> = {};

	for (const [key, value] of Object.entries(config)) {
		if (key.startsWith("webhookHeader_")) {
			// Collect webhook headers
			const headerKey = key.replace("webhookHeader_", "");
			let headerValue = value;
			if (typeof headerValue === "string" && isEncrypted(headerValue)) {
				try {
					headerValue = decrypt(headerValue, secret);
				} catch {
					// Use original if decryption fails
				}
			}
			if (typeof headerValue === "string" && headerValue.length > 0) {
				webhookHeaders[headerKey] = headerValue;
			}
		} else if (isSensitiveField(key) && typeof value === "string") {
			// Decrypt sensitive field
			if (isEncrypted(value)) {
				try {
					result[key] = decrypt(value, secret);
				} catch {
					result[key] = value; // Use original if decryption fails
				}
			} else {
				result[key] = value;
			}
		} else {
			result[key] = value;
		}
	}

	// Add webhookHeaders if any exist
	if (Object.keys(webhookHeaders).length > 0) {
		result.webhookHeaders = webhookHeaders;
	}

	return result;
}

// Get the filter for querying notification preferences based on event type
function getEventFilter(event: NotificationEvent): Record<string, boolean> {
	switch (event) {
		case "down":
			return { notifyOnDown: true };
		case "up":
			return { notifyOnUp: true };
		case "degraded":
			return { notifyOnDegraded: true };
		case "ssl_expiring":
		case "ssl_expired":
			return { notifyOnSslExpiry: true };
		case "maintenance_started":
		case "maintenance_ended":
			return { notifyOnMaintenance: true };
		case "first_check":
			return { notifyOnFirstCheck: true };
		case "paused":
		case "resumed":
			return { notifyOnPauseResume: true };
	}
}

export async function sendNotifications(
	options: SendNotificationOptions,
): Promise<void> {
	const {
		monitor,
		event,
		incident,
		previousStatus,
		responseTime,
		statusCode,
		sslExpiryDate,
		sslDaysRemaining,
	} = options;

	const monitorNotifications = await db.monitorNotification.findMany({
		where: {
			monitorId: monitor.id,
			...getEventFilter(event),
		},
		include: { channel: true },
	});

	if (monitorNotifications.length === 0) {
		logger.debug(
			`No notification channels configured for ${event} event on monitor ${monitor.name}`,
		);
		return;
	}

	const payload = createPayload(
		monitor,
		event,
		incident,
		previousStatus,
		responseTime,
		statusCode,
		sslExpiryDate,
		sslDaysRemaining,
	);

	const results = await Promise.allSettled(
		monitorNotifications.map(({ channel }) => sendToChannel(channel, payload)),
	);

	for (const result of results) {
		if (result.status === "rejected") {
			logger.error(`Failed to send notification: ${result.reason}`);
		}
	}
}

async function sendToChannel(
	channel: NotificationChannel,
	payload: RichNotificationPayload,
): Promise<void> {
	const secret = process.env.AUTH_SECRET;
	if (!secret) {
		throw new Error("AUTH_SECRET is required for decryption");
	}

	const rawConfig = channel.config as ChannelConfig;
	const config = processConfig(rawConfig, secret);

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
			await sendWebhook(config, payload);
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
		`Sent ${payload.event} notification to ${channel.type} channel: ${channel.name}`,
	);
}

// Derive the current status from the event type
function getCurrentStatusFromEvent(
	event: NotificationEvent,
	monitorStatus: MonitorStatus,
): MonitorStatus {
	switch (event) {
		case "down":
			return "DOWN";
		case "up":
			return "UP";
		case "degraded":
			return "DEGRADED";
		default:
			// For other events (SSL, maintenance, etc.), use the monitor's actual status
			return monitorStatus;
	}
}

function createPayload(
	monitor: Monitor,
	event: NotificationEvent,
	incident?: Incident,
	previousStatus?: MonitorStatus,
	responseTime?: number,
	statusCode?: number,
	sslExpiryDate?: Date,
	sslDaysRemaining?: number,
): RichNotificationPayload {
	const emoji = getStatusEmoji(event);
	const statusText = getStatusText(event);
	const color = getEventColor(event).slack;

	// Derive current status from event (not from monitor which may be stale)
	const currentStatus = getCurrentStatusFromEvent(event, monitor.status);

	// Build message with event-specific details (no markdown - channels format themselves)
	let message = `${emoji} ${monitor.name} ${statusText}`;
	if (monitor.url) message += `\nURL: ${monitor.url}`;

	// Build event-specific data
	const eventData: RichNotificationPayload["eventData"] = {};

	// Add response time if available
	if (responseTime !== undefined) {
		eventData.responseTime = responseTime;
		message += `\nResponse time: ${responseTime}ms`;
	}

	if (statusCode !== undefined) {
		eventData.statusCode = statusCode;
	}

	// Calculate downtime for recovery events
	if (event === "up" && incident?.startedAt) {
		const downtimeDuration = Math.floor(
			(Date.now() - new Date(incident.startedAt).getTime()) / 1000,
		);
		eventData.downtimeDuration = downtimeDuration;
		eventData.downtimeFormatted = formatDuration(downtimeDuration);
		message += `\nDowntime: ${eventData.downtimeFormatted}`;
	}

	// Add SSL data for certificate events
	if (
		(event === "ssl_expiring" || event === "ssl_expired") &&
		sslExpiryDate !== undefined
	) {
		eventData.sslExpiryDate = sslExpiryDate.toISOString();
		eventData.sslDaysRemaining = sslDaysRemaining;
		message += `\nSSL Expires: ${sslExpiryDate.toLocaleDateString()} (${sslDaysRemaining} days)`;
	}

	// Add incident info to message
	if (incident) {
		message += `\nIncident: ${incident.title}`;
	}

	return {
		title: `${monitor.name} Status Update`,
		message,
		event,
		color,
		timestamp: new Date().toISOString(),
		monitor: {
			id: monitor.id,
			name: monitor.name,
			url: monitor.url,
			type: monitor.type,
			currentStatus,
			previousStatus,
		},
		eventData: Object.keys(eventData).length > 0 ? eventData : undefined,
		incident: incident
			? {
					id: incident.id,
					title: incident.title,
					severity: incident.severity,
				}
			: undefined,
	};
}
