// Shared types for all notification channels

export type NotificationEvent = "down" | "up" | "degraded";

export interface NotificationPayload {
	title: string;
	message: string;
	event: NotificationEvent;
	color: string;
	timestamp: string;
}

// Channel config types - used for validation
export interface SlackConfig {
	slackWebhookUrl: string;
	slackChannel?: string;
}

export interface DiscordConfig {
	discordWebhookUrl: string;
}

export interface TelegramConfig {
	telegramBotToken: string;
	telegramChatId: string;
}

export interface WebhookConfig {
	webhookUrl: string;
	webhookMethod?: string;
	webhookHeaders?: Record<string, string>;
}

export interface SmtpConfig {
	email: string;
	smtpHost: string;
	smtpPort: string;
	smtpUser: string;
	smtpPassword: string;
	fromEmail?: string;
	fromName?: string;
}

export interface ResendConfig {
	email: string;
	resendApiKey: string;
	fromEmail?: string;
	fromName?: string;
}

// Type for raw config from database
export type ChannelConfig = Record<
	string,
	string | Record<string, string> | undefined
>;

// Validation helpers
export function validateSlackConfig(config: ChannelConfig): SlackConfig {
	if (typeof config.slackWebhookUrl !== "string" || !config.slackWebhookUrl) {
		throw new Error("Slack webhook URL is required");
	}
	return {
		slackWebhookUrl: config.slackWebhookUrl,
		slackChannel:
			typeof config.slackChannel === "string" ? config.slackChannel : undefined,
	};
}

export function validateDiscordConfig(config: ChannelConfig): DiscordConfig {
	if (
		typeof config.discordWebhookUrl !== "string" ||
		!config.discordWebhookUrl
	) {
		throw new Error("Discord webhook URL is required");
	}
	return { discordWebhookUrl: config.discordWebhookUrl };
}

export function validateTelegramConfig(config: ChannelConfig): TelegramConfig {
	if (typeof config.telegramBotToken !== "string" || !config.telegramBotToken) {
		throw new Error("Telegram bot token is required");
	}
	if (typeof config.telegramChatId !== "string" || !config.telegramChatId) {
		throw new Error("Telegram chat ID is required");
	}
	return {
		telegramBotToken: config.telegramBotToken,
		telegramChatId: config.telegramChatId,
	};
}

export function validateWebhookConfig(config: ChannelConfig): WebhookConfig {
	if (typeof config.webhookUrl !== "string" || !config.webhookUrl) {
		throw new Error("Webhook URL is required");
	}
	return {
		webhookUrl: config.webhookUrl,
		webhookMethod:
			typeof config.webhookMethod === "string"
				? config.webhookMethod
				: undefined,
		webhookHeaders:
			typeof config.webhookHeaders === "object"
				? config.webhookHeaders
				: undefined,
	};
}

export function validateSmtpConfig(config: ChannelConfig): SmtpConfig {
	if (typeof config.email !== "string" || !config.email) {
		throw new Error("Email address is required");
	}
	if (typeof config.smtpHost !== "string" || !config.smtpHost) {
		throw new Error("SMTP host is required");
	}
	if (typeof config.smtpPort !== "string" || !config.smtpPort) {
		throw new Error("SMTP port is required");
	}
	if (typeof config.smtpUser !== "string" || !config.smtpUser) {
		throw new Error("SMTP username is required");
	}
	if (typeof config.smtpPassword !== "string" || !config.smtpPassword) {
		throw new Error("SMTP password is required");
	}
	return {
		email: config.email,
		smtpHost: config.smtpHost,
		smtpPort: config.smtpPort,
		smtpUser: config.smtpUser,
		smtpPassword: config.smtpPassword,
		fromEmail:
			typeof config.fromEmail === "string" ? config.fromEmail : undefined,
		fromName: typeof config.fromName === "string" ? config.fromName : undefined,
	};
}

export function validateResendConfig(config: ChannelConfig): ResendConfig {
	if (typeof config.email !== "string" || !config.email) {
		throw new Error("Email address is required");
	}
	if (typeof config.resendApiKey !== "string" || !config.resendApiKey) {
		throw new Error("Resend API key is required");
	}
	return {
		email: config.email,
		resendApiKey: config.resendApiKey,
		fromEmail:
			typeof config.fromEmail === "string" ? config.fromEmail : undefined,
		fromName: typeof config.fromName === "string" ? config.fromName : undefined,
	};
}

// Helper to get color based on event
export function getEventColor(event: NotificationEvent): {
	hex: number;
	css: string;
	slack: string;
} {
	switch (event) {
		case "up":
			return { hex: 0x22c55e, css: "#22c55e", slack: "good" };
		case "down":
			return { hex: 0xef4444, css: "#ef4444", slack: "danger" };
		case "degraded":
			return { hex: 0xeab308, css: "#eab308", slack: "warning" };
	}
}

export function getStatusText(event: NotificationEvent): string {
	switch (event) {
		case "up":
			return "is back online";
		case "down":
			return "is down";
		case "degraded":
			return "is degraded";
	}
}

export function getStatusEmoji(event: NotificationEvent): string {
	switch (event) {
		case "up":
			return "✅";
		case "down":
			return "🔴";
		case "degraded":
			return "🟡";
	}
}
