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

interface ClientData {
	send: (data: string) => void;
	subscribedMonitors: Set<string>;
}

// Store connected clients with WeakMap for proper cleanup
const clients = new Set<ClientData>();
// Map WebSocket instances to their client data for proper subscription handling
const wsToClient = new WeakMap<object, ClientData>();

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
		const client: ClientData = {
			send: (data: string) => ws.send(data),
			subscribedMonitors: new Set<string>(),
		};
		clients.add(client);
		wsToClient.set(ws, client);
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

	close(ws) {
		// Find and remove the client using the WeakMap
		const client = wsToClient.get(ws);
		if (client) {
			clients.delete(client);
			wsToClient.delete(ws);
		}
		logger.info(
			`WebSocket client disconnected. Total clients: ${clients.size}`,
		);
	},

	message(ws, message) {
		try {
			const data = typeof message === "string" ? JSON.parse(message) : message;
			const client = wsToClient.get(ws);

			if (!client) {
				logger.warn("Received message from unknown WebSocket client");
				return;
			}

			// Handle subscription messages - only update THIS client's subscriptions
			if (data.type === "subscribe" && Array.isArray(data.monitorIds)) {
				for (const id of data.monitorIds) {
					if (typeof id === "string") {
						client.subscribedMonitors.add(id);
					}
				}
				ws.send(
					JSON.stringify({
						type: "subscribed",
						monitorIds: data.monitorIds,
					}),
				);
			}

			if (data.type === "unsubscribe" && Array.isArray(data.monitorIds)) {
				for (const id of data.monitorIds) {
					if (typeof id === "string") {
						client.subscribedMonitors.delete(id);
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
