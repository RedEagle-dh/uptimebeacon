import {
	Activity,
	AlertTriangle,
	Bell,
	CheckCircle,
	Clock,
	Globe,
	LayoutDashboard,
	Settings,
	Wrench,
	XCircle,
} from "lucide-react";

export const STATUS_CONFIG = {
	UP: {
		label: "Operational",
		color: "bg-green-500",
		textColor: "text-green-500",
		icon: CheckCircle,
	},
	DOWN: {
		label: "Down",
		color: "bg-red-500",
		textColor: "text-red-500",
		icon: XCircle,
	},
	DEGRADED: {
		label: "Degraded",
		color: "bg-yellow-500",
		textColor: "text-yellow-500",
		icon: AlertTriangle,
	},
	PENDING: {
		label: "Pending",
		color: "bg-zinc-500",
		textColor: "text-zinc-500",
		icon: Clock,
	},
	MAINTENANCE: {
		label: "Maintenance",
		color: "bg-blue-500",
		textColor: "text-blue-500",
		icon: Wrench,
	},
} as const;

export const MONITOR_TYPES = {
	HTTP: { label: "HTTP(S)", description: "Monitor HTTP/HTTPS endpoints" },
	HTTPS: { label: "HTTPS", description: "Monitor HTTPS endpoints with TLS" },
	TCP: { label: "TCP", description: "Monitor TCP port availability" },
	PING: { label: "Ping", description: "ICMP ping monitoring" },
	DNS: { label: "DNS", description: "DNS resolution monitoring" },
	KEYWORD: { label: "Keyword", description: "Check for keyword in response" },
	JSON_QUERY: { label: "JSON Query", description: "Query JSON response" },
} as const;

export const NAVIGATION_ITEMS = [
	{
		title: "Dashboard",
		href: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		title: "Monitors",
		href: "/dashboard/monitors",
		icon: Activity,
	},
	{
		title: "Incidents",
		href: "/dashboard/incidents",
		icon: AlertTriangle,
	},
	{
		title: "Status Pages",
		href: "/dashboard/status-pages",
		icon: Globe,
	},
	{
		title: "Notifications",
		href: "/dashboard/notifications",
		icon: Bell,
	},
	{
		title: "Settings",
		href: "/dashboard/settings",
		icon: Settings,
	},
] as const;

export const CHECK_INTERVALS = [
	{ value: 30, label: "30 seconds" },
	{ value: 60, label: "1 minute" },
	{ value: 120, label: "2 minutes" },
	{ value: 300, label: "5 minutes" },
	{ value: 600, label: "10 minutes" },
	{ value: 900, label: "15 minutes" },
	{ value: 1800, label: "30 minutes" },
	{ value: 3600, label: "1 hour" },
] as const;

export const SEVERITY_CONFIG = {
	minor: {
		label: "Minor",
		badgeClass: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
		dotClass: "bg-yellow-500",
	},
	major: {
		label: "Major",
		badgeClass: "bg-orange-500/10 text-orange-500 border-orange-500/20",
		dotClass: "bg-orange-500",
	},
	critical: {
		label: "Critical",
		badgeClass: "bg-red-500/10 text-red-500 border-red-500/20",
		dotClass: "bg-red-500",
	},
} as const;

export const INCIDENT_STATUS_CONFIG = {
	investigating: {
		label: "Investigating",
		badgeClass: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
		dotClass: "bg-yellow-500",
	},
	identified: {
		label: "Identified",
		badgeClass: "bg-orange-500/10 text-orange-500 border-orange-500/20",
		dotClass: "bg-orange-500",
	},
	monitoring: {
		label: "Monitoring",
		badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
		dotClass: "bg-blue-500",
	},
	resolved: {
		label: "Resolved",
		badgeClass: "bg-green-500/10 text-green-500 border-green-500/20",
		dotClass: "bg-green-500",
	},
} as const;

export const CHANNEL_COLORS = {
	DISCORD: {
		bgClass: "bg-indigo-500/10",
		textClass: "text-indigo-500",
	},
	SLACK: {
		bgClass: "bg-green-500/10",
		textClass: "text-green-500",
	},
	EMAIL: {
		bgClass: "bg-blue-500/10",
		textClass: "text-blue-500",
	},
	RESEND: {
		bgClass: "bg-purple-500/10",
		textClass: "text-purple-500",
	},
	WEBHOOK: {
		bgClass: "bg-orange-500/10",
		textClass: "text-orange-500",
	},
	TELEGRAM: {
		bgClass: "bg-sky-500/10",
		textClass: "text-sky-500",
	},
} as const;

export const NOTIFICATION_CHANNEL_TYPES = [
	"RESEND",
	"SLACK",
	"DISCORD",
	"TELEGRAM",
	"EMAIL",
	"WEBHOOK",
] as const;

export type NotificationChannelType =
	(typeof NOTIFICATION_CHANNEL_TYPES)[number];

interface ChannelFieldConfig {
	name: string;
	label: string;
	placeholder: string;
	required: boolean;
	type: "text" | "url" | "email" | "textarea" | "password";
	description?: string;
}

export const NOTIFICATION_CHANNEL_FIELDS: Record<
	NotificationChannelType,
	{
		label: string;
		description: string;
		fields: ChannelFieldConfig[];
	}
> = {
	EMAIL: {
		label: "Email",
		description: "Send notifications via email using custom SMTP server",
		fields: [
			{
				name: "email",
				label: "Recipient Email",
				placeholder: "alerts@example.com",
				required: true,
				type: "email",
				description: "Email address to receive notifications",
			},
			{
				name: "smtpHost",
				label: "SMTP Host",
				placeholder: "smtp.example.com",
				required: true,
				type: "text",
				description: "SMTP server hostname",
			},
			{
				name: "smtpPort",
				label: "SMTP Port",
				placeholder: "587",
				required: true,
				type: "text",
				description: "SMTP server port (usually 587 for TLS or 465 for SSL)",
			},
			{
				name: "smtpUser",
				label: "SMTP Username",
				placeholder: "user@example.com",
				required: true,
				type: "text",
				description: "SMTP authentication username",
			},
			{
				name: "smtpPassword",
				label: "SMTP Password",
				placeholder: "••••••••",
				required: true,
				type: "password",
				description: "SMTP authentication password",
			},
			{
				name: "fromEmail",
				label: "From Email",
				placeholder: "notifications@yourdomain.com",
				required: false,
				type: "email",
				description: "Sender email address",
			},
			{
				name: "fromName",
				label: "From Name",
				placeholder: "UptimeBeacon",
				required: false,
				type: "text",
				description: "Sender display name",
			},
		],
	},
	RESEND: {
		label: "Resend",
		description: "Send notifications via Resend API",
		fields: [
			{
				name: "email",
				label: "Recipient Email",
				placeholder: "alerts@example.com",
				required: true,
				type: "email",
				description: "Email address to receive notifications",
			},
			{
				name: "resendApiKey",
				label: "API Key",
				placeholder: "re_xxxxxxxx",
				required: true,
				type: "password",
				description: "Your Resend API key",
			},
			{
				name: "fromEmail",
				label: "From Email",
				placeholder: "notifications@yourdomain.com",
				required: false,
				type: "email",
				description: "Sender email address (must be verified in Resend)",
			},
			{
				name: "fromName",
				label: "From Name",
				placeholder: "UptimeBeacon",
				required: false,
				type: "text",
				description: "Sender display name",
			},
		],
	},
	SLACK: {
		label: "Slack",
		description: "Send notifications to a Slack channel",
		fields: [
			{
				name: "slackWebhookUrl",
				label: "Webhook URL",
				placeholder: "https://hooks.slack.com/services/...",
				required: true,
				type: "password",
				description: "Slack incoming webhook URL",
			},
			{
				name: "slackChannel",
				label: "Channel",
				placeholder: "#alerts",
				required: false,
				type: "text",
				description: "Override the default channel (optional)",
			},
		],
	},
	DISCORD: {
		label: "Discord",
		description: "Send notifications to a Discord channel",
		fields: [
			{
				name: "discordWebhookUrl",
				label: "Webhook URL",
				placeholder: "https://discord.com/api/webhooks/...",
				required: true,
				type: "password",
				description: "Discord webhook URL",
			},
		],
	},
	TELEGRAM: {
		label: "Telegram",
		description: "Send notifications via Telegram bot",
		fields: [
			{
				name: "telegramBotToken",
				label: "Bot Token",
				placeholder: "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ",
				required: true,
				type: "password",
				description: "Telegram bot token from @BotFather",
			},
			{
				name: "telegramChatId",
				label: "Chat ID",
				placeholder: "-1001234567890",
				required: true,
				type: "text",
				description: "Telegram chat or group ID",
			},
		],
	},
	WEBHOOK: {
		label: "Webhook",
		description: "Send notifications to a custom webhook",
		fields: [
			{
				name: "webhookUrl",
				label: "Webhook URL",
				placeholder: "https://api.example.com/webhook",
				required: true,
				type: "password",
				description: "URL to receive webhook POST requests",
			},
			{
				name: "webhookMethod",
				label: "HTTP Method",
				placeholder: "POST",
				required: false,
				type: "text",
				description: "HTTP method (GET or POST, defaults to POST)",
			},
			{
				name: "webhookHeaders",
				label: "Custom Headers",
				placeholder: '{"Authorization": "Bearer token"}',
				required: false,
				type: "textarea",
				description: "Custom headers as JSON (optional)",
			},
		],
	},
} as const;
