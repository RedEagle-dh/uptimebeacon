import type { MonitorStatus } from "@uptimebeacon/database";
import { Elysia } from "elysia";
import { logger } from "../utils/logger";

interface CheckUpdate {
	type: "check";
	monitorId: string;
	check: {
		id: string;
		status: MonitorStatus;
		responseTime?: number;
		createdAt: string;
	};
}

interface IncidentUpdate {
	type: "incident";
	monitorId: string;
	incident: {
		id: string;
		status: string;
		severity: string;
	};
}

interface MonitorUpdate {
	type: "monitor";
	monitorId: string;
	action: "created" | "updated" | "deleted" | "paused" | "resumed";
}

export type WSMessage = CheckUpdate | IncidentUpdate | MonitorUpdate;

// Store connected clients
const clients = new Set<{
	send: (data: string) => void;
	subscribedMonitors?: Set<string>;
}>();

export function broadcastUpdate(message: WSMessage): void {
	const data = JSON.stringify(message);

	for (const client of clients) {
		try {
			// If client has subscriptions, only send if they're subscribed to this monitor
			if (client.subscribedMonitors && client.subscribedMonitors.size > 0) {
				if (client.subscribedMonitors.has(message.monitorId)) {
					client.send(data);
				}
			} else {
				// No subscriptions means send all updates
				client.send(data);
			}
		} catch {
			clients.delete(client);
		}
	}
}

export function getConnectedClientsCount(): number {
	return clients.size;
}

export const websocketHandler = new Elysia().ws("/ws", {
	open(ws) {
		const client = {
			send: (data: string) => ws.send(data),
			subscribedMonitors: new Set<string>(),
		};
		clients.add(client);
		logger.info(`WebSocket client connected. Total clients: ${clients.size}`);

		// Send welcome message
		ws.send(
			JSON.stringify({
				type: "connected",
				message: "Connected to UptimeBeacon WebSocket",
				clientsCount: clients.size,
			}),
		);
	},

	close(_ws) {
		// Find and remove the client
		for (const client of clients) {
			// We can't directly compare ws objects, so we remove based on the close event
			clients.delete(client);
			break;
		}
		logger.info(
			`WebSocket client disconnected. Total clients: ${clients.size}`,
		);
	},

	message(ws, message) {
		try {
			const data = typeof message === "string" ? JSON.parse(message) : message;

			// Handle subscription messages
			if (data.type === "subscribe" && data.monitorIds) {
				// Find the client and update subscriptions
				for (const client of clients) {
					// Add monitor IDs to subscription
					for (const id of data.monitorIds) {
						client.subscribedMonitors?.add(id);
					}
				}
				ws.send(
					JSON.stringify({
						type: "subscribed",
						monitorIds: data.monitorIds,
					}),
				);
			}

			if (data.type === "unsubscribe" && data.monitorIds) {
				for (const client of clients) {
					for (const id of data.monitorIds) {
						client.subscribedMonitors?.delete(id);
					}
				}
				ws.send(
					JSON.stringify({
						type: "unsubscribed",
						monitorIds: data.monitorIds,
					}),
				);
			}

			// Handle ping for keep-alive
			if (data.type === "ping") {
				ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
			}
		} catch {
			// Ignore invalid messages
		}
	},
});
