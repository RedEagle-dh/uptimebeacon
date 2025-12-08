import { logger } from "../../../utils/logger";
import type { ChannelConfig, NotificationPayload } from "./types";
import { validateTelegramConfig } from "./types";

interface TelegramResponse {
	ok: boolean;
	description?: string;
	error_code?: number;
}

export async function sendTelegram(
	rawConfig: ChannelConfig,
	payload: NotificationPayload,
): Promise<void> {
	const config = validateTelegramConfig(rawConfig);
	const text = `*${payload.title}*\n\n${payload.message}`;

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
