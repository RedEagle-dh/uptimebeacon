import { logger } from "../../../utils/logger";
import type {
	ChannelConfig,
	NotificationPayload,
	RichNotificationPayload,
} from "./types";
import { getStatusEmoji, getStatusText, validateTelegramConfig } from "./types";

interface TelegramResponse {
	ok: boolean;
	description?: string;
	error_code?: number;
}

// Format message with Telegram markdown (uses *bold*)
function formatTelegramMessage(payload: RichNotificationPayload): string {
	const emoji = getStatusEmoji(payload.event);
	const statusText = getStatusText(payload.event);

	let message = `${emoji} *${payload.monitor.name}* ${statusText}`;
	if (payload.monitor.url) message += `\nURL: ${payload.monitor.url}`;
	if (payload.eventData?.responseTime !== undefined) {
		message += `\nResponse time: ${payload.eventData.responseTime}ms`;
	}
	if (payload.eventData?.downtimeFormatted) {
		message += `\nDowntime: ${payload.eventData.downtimeFormatted}`;
	}
	if (payload.incident) {
		message += `\nIncident: ${payload.incident.title}`;
	}
	return message;
}

export async function sendTelegram(
	rawConfig: ChannelConfig,
	payload: NotificationPayload | RichNotificationPayload,
): Promise<void> {
	const config = validateTelegramConfig(rawConfig);

	const isRichPayload = (
		p: NotificationPayload,
	): p is RichNotificationPayload => "monitor" in p;

	// Build text with rich data details
	let text = `*${payload.title}*\n\n${isRichPayload(payload) ? formatTelegramMessage(payload) : payload.message}`;

	if (isRichPayload(payload)) {
		const details: string[] = [];

		if (payload.monitor.previousStatus) {
			details.push(`Previous: ${payload.monitor.previousStatus}`);
		}
		details.push(`Current: ${payload.monitor.currentStatus}`);

		if (payload.eventData?.responseTime !== undefined) {
			details.push(`Response Time: ${payload.eventData.responseTime}ms`);
		}

		if (payload.eventData?.downtimeFormatted) {
			details.push(`Downtime: ${payload.eventData.downtimeFormatted}`);
		}

		if (payload.eventData?.sslDaysRemaining !== undefined) {
			details.push(
				`SSL Expires in: ${payload.eventData.sslDaysRemaining} days`,
			);
		}

		if (details.length > 0) {
			text += `\n\n_Details:_\n${details.join("\n")}`;
		}
	}

	// Debug: log masked token and chat ID
	const maskedToken = config.telegramBotToken
		? `${config.telegramBotToken.substring(0, 6)}...${config.telegramBotToken.slice(-4)}`
		: "EMPTY";
	logger.info(
		`Telegram: sending to chat ${config.telegramChatId} with token ${maskedToken}`,
	);

	const response = await fetch(
		`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				chat_id: config.telegramChatId,
				text,
				parse_mode: "Markdown",
			}),
		},
	);

	const data = (await response.json()) as TelegramResponse;

	if (!data.ok) {
		throw new Error(
			`Telegram API error: ${data.description ?? "Unknown error"} (code: ${data.error_code ?? "unknown"})`,
		);
	}
}
