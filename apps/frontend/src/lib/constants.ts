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
